import { Link } from "react-router-dom";
import { FileClock, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

function Post() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="surface w-full max-w-xl p-8 text-left">
        <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
          <FileClock className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Phân hệ bài viết đang được nâng cấp</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang này sẽ sớm có giao diện quản trị nội dung đầy đủ. Bạn có thể quay lại các phân hệ
          chính để tiếp tục công việc.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Về trang chủ
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent"
          >
            Mở danh mục
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default Post;
