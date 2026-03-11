import Layout from "@/components/Layout.js";
import { Button } from "@/components/ui/button.js";
import { Card, CardContent } from "@/components/ui/card.js";

export default function HomePage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Habit Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            用科学的方法，养成更好的习惯
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <div className="text-4xl">🌱</div>
            <p className="text-center text-muted-foreground">
              还没有习惯？创建你的第一个吧
            </p>
            <Button size="lg">＋ 创建习惯</Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
