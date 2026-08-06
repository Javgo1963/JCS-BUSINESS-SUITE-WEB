//
// JCS Business Suite
// useDashboardSnapshot.ts
//
// Loads the live business snapshot displayed by DashboardView.
// All business data is isolated by businessID.
//

"use client";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { db } from "@/core/firebase/firebase";

// MARK: - Types

export interface DashboardSnapshot {
  revenueToday: number;
  openOrders: number;
  customers: number;
  activeProducts: number;
  lowStockProducts: number;
}

export interface DashboardRecentActivity {
  id: string;
  title: string;
  detail: string;
  timestamp: Date;
  route?: string;
  type:
    | "order"
    | "payment"
    | "shipment"
    | "inventory"
    | "customer"
    | "business"
    | "general";
}

export interface UseDashboardSnapshotResult {
  snapshot: DashboardSnapshot;
  recentActivity: DashboardRecentActivity[];
  isLoading: boolean;
  errorMessage: string | null;
  refreshedAt: Date | null;
  refresh: () => Promise<void>;
}

interface UseDashboardSnapshotOptions {
  businessID?: string | null;
  enabled?: boolean;
}

// MARK: - Constants

const EMPTY_SNAPSHOT: DashboardSnapshot = {
  revenueToday: 0,
  openOrders: 0,
  customers: 0,
  activeProducts: 0,
  lowStockProducts: 0,
};

const OPEN_ORDER_STATUSES = new Set([
  "pending",
  "confirmed",
  "processing",
  "preparing",
  "ready",
  "paid",
  "partiallypaid",
  "partially-paid",
  "shipped",
  "outfordelivery",
  "out-for-delivery",
]);

// MARK: - Firestore Helpers

function startOfToday(): Date {
  const value = new Date();

  value.setHours(0, 0, 0, 0);

  return value;
}

function startOfTomorrow(): Date {
  const value = startOfToday();

  value.setDate(value.getDate() + 1);

  return value;
}

function normalizedString(
  value: unknown
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

function normalizedStatus(
  value: unknown
): string {
  return normalizedString(value)
    .replace(/-/g, "");
}

function numberValue(
  value: unknown
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(
      value
        .replace(/[$,\s]/g, "")
        .trim()
    );

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }

  return 0;
}

function booleanValue(
  value: unknown,
  fallback = false
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized =
      value.trim().toLowerCase();

    if (
      normalized === "true" ||
      normalized === "yes" ||
      normalized === "1"
    ) {
      return true;
    }

    if (
      normalized === "false" ||
      normalized === "no" ||
      normalized === "0"
    ) {
      return false;
    }
  }

  return fallback;
}

function dateValue(
  value: unknown
): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    const converted = (
      value as {
        toDate: () => Date;
      }
    ).toDate();

    return Number.isNaN(converted.getTime())
      ? null
      : converted;
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const converted = new Date(value);

    return Number.isNaN(converted.getTime())
      ? null
      : converted;
  }

  return null;
}

function firstDate(
  data: DocumentData,
  keys: readonly string[]
): Date | null {
  for (const key of keys) {
    const resolved = dateValue(data[key]);

    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function firstString(
  data: DocumentData,
  keys: readonly string[]
): string {
  for (const key of keys) {
    const value = data[key];

    if (
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      return value.trim();
    }
  }

  return "";
}

function firstNumber(
  data: DocumentData,
  keys: readonly string[]
): number {
  for (const key of keys) {
    const value = data[key];

    if (
      typeof value === "number" ||
      typeof value === "string"
    ) {
      return numberValue(value);
    }
  }

  return 0;
}

function isSameBusiness(
  data: DocumentData,
  businessID: string
): boolean {
  const documentBusinessID =
    firstString(data, [
      "businessID",
      "businessId",
      "tenantID",
      "tenantId",
    ]);

  return documentBusinessID === businessID;
}

function isDateToday(
  date: Date | null
): boolean {
  if (!date) {
    return false;
  }

  return (
    date >= startOfToday() &&
    date < startOfTomorrow()
  );
}

// MARK: - Revenue

function orderRevenue(
  data: DocumentData
): number {
  return firstNumber(data, [
    "grandTotal",
    "total",
    "orderTotal",
    "amount",
    "totalAmount",
    "paidAmount",
  ]);
}

function isCancelledOrder(
  data: DocumentData
): boolean {
  const status = normalizedStatus(
    data.status ??
      data.orderStatus ??
      data.fulfillmentStatus
  );

  return (
    status === "cancelled" ||
    status === "canceled" ||
    status === "void" ||
    status === "refunded"
  );
}

function isOpenOrder(
  data: DocumentData
): boolean {
  if (isCancelledOrder(data)) {
    return false;
  }

  const status = normalizedStatus(
    data.status ??
      data.orderStatus ??
      data.fulfillmentStatus
  );

  if (!status) {
    return true;
  }

  if (
    status === "completed" ||
    status === "delivered" ||
    status === "closed" ||
    status === "cancelled" ||
    status === "canceled" ||
    status === "refunded" ||
    status === "void"
  ) {
    return false;
  }

  return OPEN_ORDER_STATUSES.has(status);
}

// MARK: - Inventory

function productIsActive(
  data: DocumentData
): boolean {
  if ("isActive" in data) {
    return booleanValue(data.isActive, true);
  }

  if ("active" in data) {
    return booleanValue(data.active, true);
  }

  return true;
}

function productQuantity(
  data: DocumentData
): number {
  return firstNumber(data, [
    "quantity",
    "quantityOnHand",
    "stockQuantity",
    "inventoryQuantity",
    "onHand",
    "availableQuantity",
  ]);
}

function productReorderLevel(
  data: DocumentData
): number {
  return firstNumber(data, [
    "reorderLevel",
    "reorderPoint",
    "minimumStock",
    "minimumQuantity",
    "lowStockThreshold",
  ]);
}

function productIsLowStock(
  data: DocumentData
): boolean {
  if (!productIsActive(data)) {
    return false;
  }

  if ("isLowStock" in data) {
    return booleanValue(
      data.isLowStock,
      false
    );
  }

  const quantity = productQuantity(data);
  const reorderLevel =
    productReorderLevel(data);

  if (reorderLevel > 0) {
    return quantity <= reorderLevel;
  }

  return quantity <= 0;
}

// MARK: - Activity Helpers

function orderActivity(
  id: string,
  data: DocumentData
): DashboardRecentActivity {
  const orderNumber =
    firstString(data, [
      "orderNumber",
      "number",
      "displayNumber",
    ]) || id.slice(0, 8).toUpperCase();

  const customerName =
    firstString(data, [
      "customerName",
      "customerFullName",
      "fullName",
    ]) || "Customer";

  const timestamp =
    firstDate(data, [
      "updatedAt",
      "createdAt",
      "orderDate",
      "date",
    ]) ?? new Date();

  const status =
    firstString(data, [
      "status",
      "orderStatus",
      "fulfillmentStatus",
    ]) || "Updated";

  return {
    id: `order-${id}`,
    title: `Order ${orderNumber}`,
    detail: `${customerName} · ${status}`,
    timestamp,
    route: "/orders",
    type: "order",
  };
}

function customerActivity(
  id: string,
  data: DocumentData
): DashboardRecentActivity {
  const customerName =
    firstString(data, [
      "fullName",
      "name",
      "displayName",
      "companyName",
    ]) || "New customer";

  const timestamp =
    firstDate(data, [
      "updatedAt",
      "createdAt",
      "date",
    ]) ?? new Date();

  return {
    id: `customer-${id}`,
    title: customerName,
    detail: "Customer record updated",
    timestamp,
    route: "/customers",
    type: "customer",
  };
}

function productActivity(
  id: string,
  data: DocumentData
): DashboardRecentActivity {
  const productName =
    firstString(data, [
      "name",
      "productName",
      "title",
      "sku",
    ]) || "Inventory item";

  const timestamp =
    firstDate(data, [
      "updatedAt",
      "createdAt",
      "lastInventoryUpdate",
    ]) ?? new Date();

  const lowStock =
    productIsLowStock(data);

  return {
    id: `product-${id}`,
    title: productName,
    detail: lowStock
      ? "Low inventory requires attention"
      : "Product inventory updated",
    timestamp,
    route: "/inventory",
    type: "inventory",
  };
}

// MARK: - Firestore Reads

async function loadBusinessCollection(
  collectionName: string,
  businessID: string,
  additionalConstraints: QueryConstraint[] = []
) {
  const reference = collection(
    db,
    collectionName
  );

  try {
    const collectionQuery = query(
      reference,
      where(
        "businessID",
        "==",
        businessID
      ),
      ...additionalConstraints
    );

    return await getDocs(collectionQuery);
  } catch (error) {
    /*
     * Compatibility fallback:
     *
     * Some older Firestore records may use businessId rather than
     * businessID. This keeps the dashboard functional while the
     * database is standardized.
     */

    try {
      const alternateQuery = query(
        reference,
        where(
          "businessId",
          "==",
          businessID
        ),
        ...additionalConstraints
      );

      return await getDocs(alternateQuery);
    } catch {
      throw error;
    }
  }
}

async function loadRecentBusinessCollection(
  collectionName: string,
  businessID: string,
  maximumDocuments = 10
) {
  try {
    return await loadBusinessCollection(
      collectionName,
      businessID,
      [
        orderBy("updatedAt", "desc"),
        limit(maximumDocuments),
      ]
    );
  } catch {
    try {
      return await loadBusinessCollection(
        collectionName,
        businessID,
        [
          orderBy("createdAt", "desc"),
          limit(maximumDocuments),
        ]
      );
    } catch {
      /*
       * Final fallback when no Firestore composite index exists yet.
       * The result is filtered and sorted locally.
       */

      return loadBusinessCollection(
        collectionName,
        businessID
      );
    }
  }
}

// MARK: - Hook

export function useDashboardSnapshot({
  businessID,
  enabled = true,
}: UseDashboardSnapshotOptions): UseDashboardSnapshotResult {
  const [snapshot, setSnapshot] =
    useState<DashboardSnapshot>(
      EMPTY_SNAPSHOT
    );

  const [
    recentActivity,
    setRecentActivity,
  ] = useState<
    DashboardRecentActivity[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);

  const [refreshedAt, setRefreshedAt] =
    useState<Date | null>(null);

  const normalizedBusinessID =
    useMemo(
      () => businessID?.trim() || "",
      [businessID]
    );

    

  const refresh = useCallback(async () => {
    if (
      !enabled ||
      !normalizedBusinessID
    ) {
      setSnapshot(EMPTY_SNAPSHOT);
      setRecentActivity([]);
      setErrorMessage(null);
      setIsLoading(false);

      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [
        ordersSnapshot,
        customersSnapshot,
        productsSnapshot,
      ] = await Promise.all([
        loadRecentBusinessCollection(
          "orders",
          normalizedBusinessID,
          100
        ),

        loadRecentBusinessCollection(
          "customers",
          normalizedBusinessID,
          100
        ),

        loadRecentBusinessCollection(
          "products",
          normalizedBusinessID,
          150
        ),
      ]);

      let revenueToday = 0;
      let openOrders = 0;

      const orderActivities:
        DashboardRecentActivity[] = [];

      ordersSnapshot.docs.forEach(
        (document) => {
          const data = document.data();

          if (
            !isSameBusiness(
              data,
              normalizedBusinessID
            )
          ) {
            return;
          }

          const orderDate =
            firstDate(data, [
              "paidAt",
              "completedAt",
              "createdAt",
              "orderDate",
              "date",
            ]);

          if (
            isDateToday(orderDate) &&
            !isCancelledOrder(data)
          ) {
            revenueToday +=
              orderRevenue(data);
          }

          if (isOpenOrder(data)) {
            openOrders += 1;
          }

          orderActivities.push(
            orderActivity(
              document.id,
              data
            )
          );
        }
      );

      let customerCount = 0;

      const customerActivities:
        DashboardRecentActivity[] = [];

      customersSnapshot.docs.forEach(
        (document) => {
          const data = document.data();

          if (
            !isSameBusiness(
              data,
              normalizedBusinessID
            )
          ) {
            return;
          }

          customerCount += 1;

          customerActivities.push(
            customerActivity(
              document.id,
              data
            )
          );
        }
      );

      let activeProducts = 0;
      let lowStockProducts = 0;

      const productActivities:
        DashboardRecentActivity[] = [];

      productsSnapshot.docs.forEach(
        (document) => {
          const data = document.data();

          if (
            !isSameBusiness(
              data,
              normalizedBusinessID
            )
          ) {
            return;
          }

          if (productIsActive(data)) {
            activeProducts += 1;
          }

          if (productIsLowStock(data)) {
            lowStockProducts += 1;
          }

          productActivities.push(
            productActivity(
              document.id,
              data
            )
          );
        }
      );

      const mergedActivity = [
        ...orderActivities,
        ...customerActivities,
        ...productActivities,
      ]
        .sort(
          (first, second) =>
            second.timestamp.getTime() -
            first.timestamp.getTime()
        )
        .slice(0, 8);

      setSnapshot({
        revenueToday,
        openOrders,
        customers: customerCount,
        activeProducts,
        lowStockProducts,
      });

      setRecentActivity(
        mergedActivity
      );

      setRefreshedAt(new Date());
    } catch (error) {
      console.error(
        "Unable to load dashboard snapshot:",
        error
      );

      setErrorMessage(
        "The business snapshot could not be loaded."
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    normalizedBusinessID,
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    snapshot,
    recentActivity,
    isLoading,
    errorMessage,
    refreshedAt,
    refresh,
  };
}

export default useDashboardSnapshot;