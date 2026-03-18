import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateRoleCard({ newRole, setNewRole, onSubmit, isCreatingRole }) {
  return (
    <Card className="space-y-3 p-4">
      <h2 className="text-lg font-semibold">2) Tạo role mới</h2>
      <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <Input
          placeholder="Tên role"
          value={newRole.name}
          onChange={(e) => setNewRole((prev) => ({ ...prev, name: e.target.value }))}
        />
        <Input
          placeholder="Mô tả role"
          value={newRole.description}
          onChange={(e) => setNewRole((prev) => ({ ...prev, description: e.target.value }))}
        />
        <div className="md:col-span-2">
          <Button className="w-full sm:w-auto" type="submit" disabled={isCreatingRole}>
            {isCreatingRole ? "Đang tạo..." : "Tạo role"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
