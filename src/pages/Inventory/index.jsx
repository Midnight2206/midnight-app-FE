import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetCategoriesQuery } from "@/features/category/categoryApi";
import AllocationIssueTab from "@/pages/Inventory/components/AllocationIssueTab";
import IssueHistoryTab from "@/pages/Inventory/components/IssueHistoryTab";
import OtherIssueTab from "@/pages/Inventory/components/OtherIssueTab";
import WarehouseManagementTab from "@/pages/Inventory/components/WarehouseManagementTab";
import { DISPLAY_LABELS } from "@/utils/constants";

function InventoryWorkspaceHero() {
  return (
    <Card className="overflow-hidden border-primary/10 bg-gradient-to-r from-primary/[0.08] via-background to-background shadow-sm">
      <div className="space-y-2 p-4 sm:p-5">
        <div className="text-xs font-medium uppercase tracking-[0.2em] text-primary/70">
          {DISPLAY_LABELS.inventoryWorkspace}
        </div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Quản lý kho và cấp phát quân trang
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Màn hình này tập trung vào nghiệp vụ kho quân trang, cấp phát theo chế
          độ mới và tra cứu lại phiếu xuất kho đã tạo. Phần niên hạn quân trang
          đã được chuyển sang khu vực Danh mục.
        </p>
      </div>
    </Card>
  );
}

function InventoryTabsHeader() {
  return (
    <Card className="overflow-hidden border-primary/10 bg-gradient-to-r from-background via-background to-primary/5 p-2 shadow-sm">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <TabsList className="inline-flex min-w-max rounded-xl bg-muted/70 p-1">
          <TabsTrigger value="warehouses">Kho đơn vị</TabsTrigger>
          <TabsTrigger value="allocation-issue">Cấp phát quân trang</TabsTrigger>
          <TabsTrigger value="other-issue">Xuất khác</TabsTrigger>
          <TabsTrigger value="issue-history">Lịch sử cấp phát</TabsTrigger>
        </TabsList>
      </div>
    </Card>
  );
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("allocation-issue");

  const { data: categoriesData } = useGetCategoriesQuery({
    status: "active",
    sortBy: "name",
    order: "asc",
  });
  const categories = categoriesData?.categories || [];

  return (
    <div className="space-y-5 p-3 sm:space-y-6 sm:p-6">
      <InventoryWorkspaceHero />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-5"
      >
        <InventoryTabsHeader />

        <TabsContent value="warehouses" className="mt-0">
          <WarehouseManagementTab categories={categories} />
        </TabsContent>

        <TabsContent value="allocation-issue" className="mt-0">
          <AllocationIssueTab />
        </TabsContent>

        <TabsContent value="other-issue" className="mt-0">
          <OtherIssueTab />
        </TabsContent>

        <TabsContent value="issue-history" className="mt-0">
          <IssueHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
