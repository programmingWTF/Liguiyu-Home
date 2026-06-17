import { getAllPosts } from "@/app/lib/posts";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import InteractiveSection from "@/app/components/InteractiveSection";
import PageGlow from "@/app/components/PageGlow";
import ClickRipple from "@/app/components/ClickRipple";
import BlogListClient from "./blog-list-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "博客 · 南航工具箱",
  description: "技术教程、工具体验、踩坑记录",
};

export default function BlogListPage() {
  const posts = getAllPosts();

  return (
    <>
      <PageGlow />
      <ClickRipple />
      <Navbar />
      <main className="flex-1">
        <div className="pt-20">
          <InteractiveSection id="blog-list" theme="lab">
            <BlogListClient posts={posts} />
          </InteractiveSection>
        </div>
      </main>
      <Footer />
    </>
  );
}
