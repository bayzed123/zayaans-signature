/** Style contract: preserve the Zayaan’s Signature couture editorial system across every route. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router as WouterRouter, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import Admin from "./pages/Admin";
import Cart from "./pages/Cart";
import Catalogue from "./pages/Catalogue";
import CustomerDiscovery from "./pages/CustomerDiscovery";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Track from "./pages/Track";
import Wishlist from "./pages/Wishlist";

function AppRoutes() {
  // make sure to consider if you need authentication for certain routes
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/collection" component={Catalogue} />
      <Route path="/category/:slug" component={Catalogue} />
      <Route path="/products/:slug" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/track" component={Track} />
      <Route path="/discover" component={CustomerDiscovery} />
      <Route path="/discover/:focus" component={CustomerDiscovery} />
      <Route path="/admin" component={Admin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" richColors />
          <CartProvider><WishlistProvider><AppRoutes /></WishlistProvider></CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
