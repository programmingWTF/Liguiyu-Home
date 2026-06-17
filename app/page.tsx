import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Tools from "./components/Tools";
import About from "./components/About";
import Blog from "./components/Blog";
import Footer from "./components/Footer";
import GlobalGrid from "./components/GlobalGrid";
import PageGlow from "./components/PageGlow";
import ClickRipple from "./components/ClickRipple";
import { getAllPosts } from "./lib/posts";

export const dynamic = "force-dynamic";

export default function Home() {
  const posts = getAllPosts();

  return (
    <main className="flex flex-col flex-1">
      <PageGlow />
      <GlobalGrid />
      <ClickRipple />
      <Navbar />
      <Hero />
      <Blog posts={posts} />
      <Tools />
      <About />
      <Footer />
    </main>
  );
}
