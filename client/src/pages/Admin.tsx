import { SiteLink as Link } from "@/components/SiteLink";
import { categoryImage } from "@/lib/categoryAssets";
import { API_BASE, commerceRequest, formatBdt, productImage, type Category, type Product } from "@/lib/commerce";
import { BrandedLoading, LOADING_COPY } from "@/components/BrandedLoading";
import { BarChart3, Boxes, ChevronRight, ClipboardList, Link2, LockKeyhole, PackagePlus, PencilLine, Plus, RefreshCw, Tags, Truck, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

type Overview = { productCount: number; openOrders: number; lowStock: number };
type AdminOrder = {
  id: number; order_no: string; customer_name: string; customer_phone: string; status: string; total_minor: number;
  courier_consignment_id?: string | null; courier_tracking_code?: string | null; courier_status?: string | null;
};
type Tab = "overview" | "products" | "categories" | "orders";
type ProductForm = {
  name: string; sku: string; categoryId: string; summary: string; description: string; fabric: string; leadTime: string; sizeGuide: string;
  sizes: string; colours: string; imageUrl: string; gallery: string; price: string; compareAt: string; stock: string; vatNote: string;
  fitInfo: string; washCare: string; availabilityNote: string; tryOnEnabled: boolean; status: "draft" | "active" | "archived"; featured: boolean;
};

const TOKEN_KEY = "zayaans-signature.admin-token";
const ASSET_LIBRARY_URL = "https://github.com/bayzed123/zayaans-signature/tree/main/admin-assets";
const blankProduct: ProductForm = {
  name: "", sku: "", categoryId: "", summary: "", description: "", fabric: "", leadTime: "", sizeGuide: "", sizes: "", colours: "",
  imageUrl: "", gallery: "", price: "", compareAt: "", stock: "0", vatNote: "+ VAT", fitInfo: "", washCare: "", availabilityNote: "",
  tryOnEnabled: true, status: "draft", featured: false,
};

async function adminRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  return commerceRequest<T>(path, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) } });
}

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [productEditorOpen, setProductEditorOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(blankProduct);
  const [categoryName, setCategoryName] = useState("");
  const [courierAction, setCourierAction] = useState<string | null>(null);

  const refresh = async (activeToken = token) => {
    if (!activeToken) return;
    setLoading(true);
    try {
      const [nextOverview, nextProducts, nextCategories, nextOrders] = await Promise.all([
        adminRequest<Overview>("/api/admin/overview", activeToken),
        adminRequest<{ products: Product[] }>("/api/admin/products", activeToken),
        adminRequest<{ categories: Category[] }>("/api/admin/categories", activeToken),
        adminRequest<{ orders: AdminOrder[] }>("/api/admin/orders", activeToken),
      ]);
      setOverview(nextOverview); setProducts(nextProducts.products); setCategories(nextCategories.categories); setOrders(nextOrders.orders);
    } catch (error) {
      sessionStorage.removeItem(TOKEN_KEY); setToken("");
      toast("Administrator session ended.", { description: error instanceof Error ? error.message : "Please sign in again." });
    } finally { setLoading(false); }
  };

  useEffect(() => { if (token) void refresh(); }, [token]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true);
    try {
      const session = await commerceRequest<{ token: string }>("/api/admin/session", { method: "POST", body: JSON.stringify({ username, password }) });
      sessionStorage.setItem(TOKEN_KEY, session.token); setToken(session.token); setPassword("");
    } catch (error) { toast("Sign-in failed.", { description: error instanceof Error ? error.message : "Check the credentials and try again." }); }
    finally { setLoading(false); }
  }

  function openProductEditor(product?: Product) {
    if (product) {
      setEditingId(product.id);
      setForm({
        name: product.name, sku: product.sku, categoryId: product.categoryId ? String(product.categoryId) : "", summary: product.summary, description: product.description,
        fabric: product.fabric, leadTime: product.leadTime, sizeGuide: product.sizeGuide, sizes: product.sizes.join(", "), colours: product.colours.join(", "),
        imageUrl: product.imageUrl, gallery: product.gallery.join(", "), price: String(product.priceMinor / 100), compareAt: product.compareAtMinor ? String(product.compareAtMinor / 100) : "",
        stock: String(product.stock), vatNote: product.vatNote, fitInfo: product.fitInfo, washCare: product.washCare, availabilityNote: product.availabilityNote,
        tryOnEnabled: product.tryOnEnabled, status: product.status, featured: product.featured,
      });
    } else { setEditingId(null); setForm(blankProduct); }
    setTab("products"); setProductEditorOpen(true);
    window.setTimeout(() => document.getElementById("product-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function closeProductEditor() { setEditingId(null); setForm(blankProduct); setProductEditorOpen(false); }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = { ...form, categoryId: form.categoryId || null, priceMinor: Math.round(Number(form.price) * 100), compareAtMinor: Math.round(Number(form.compareAt || 0) * 100), stock: Number(form.stock) };
    try {
      await adminRequest(editingId ? `/api/admin/products/${editingId}` : "/api/admin/products", token, { method: editingId ? "PATCH" : "POST", body: JSON.stringify(body) });
      toast(editingId ? "Piece updated." : "Piece added to the boutique."); closeProductEditor(); await refresh();
    } catch (error) { toast("We could not save this piece.", { description: error instanceof Error ? error.message : "Review the form and try again." }); }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { await adminRequest("/api/admin/categories", token, { method: "POST", body: JSON.stringify({ name: categoryName }) }); setCategoryName(""); toast("Category created."); await refresh(); }
    catch (error) { toast("We could not add that category.", { description: error instanceof Error ? error.message : "Try another name." }); }
  }

  async function updateCategoryImage(id: number, imageUrl: string) {
    try { await adminRequest(`/api/admin/categories/${id}`, token, { method: "PATCH", body: JSON.stringify({ imageUrl }) }); toast("Category image updated."); await refresh(); }
    catch (error) { toast("We could not update that category image.", { description: error instanceof Error ? error.message : "Check the URL and try again." }); }
  }

  async function updateOrder(id: number, status: string) {
    try { await adminRequest(`/api/admin/orders/${id}`, token, { method: "PATCH", body: JSON.stringify({ status, note: `Marked ${status} by the atelier.` }) }); toast("Order status updated."); await refresh(); }
    catch (error) { toast("We could not update the order.", { description: error instanceof Error ? error.message : "Try again." }); }
  }

  async function createCourierConsignment(id: number) {
    setCourierAction(`create-${id}`);
    try { await adminRequest(`/api/admin/orders/${id}/courier`, token, { method: "POST" }); toast("Steadfast consignment created."); await refresh(); }
    catch (error) { toast("We could not create the courier consignment.", { description: error instanceof Error ? error.message : "Review the order address and try again." }); }
    finally { setCourierAction(null); }
  }

  async function refreshCourierStatus(id: number) {
    setCourierAction(`status-${id}`);
    try { await adminRequest(`/api/admin/orders/${id}/courier-status`, token); toast("Steadfast delivery status refreshed."); await refresh(); }
    catch (error) { toast("We could not refresh courier status.", { description: error instanceof Error ? error.message : "Try again." }); }
    finally { setCourierAction(null); }
  }

  if (!token) return <AdminLogin username={username} password={password} setUsername={setUsername} setPassword={setPassword} loading={loading} onSubmit={login} />;
  const tabs: Array<{ id: Tab; label: string; icon: typeof BarChart3 }> = [
    { id: "overview", label: "Overview", icon: BarChart3 }, { id: "products", label: "Products", icon: Boxes },
    { id: "categories", label: "Categories", icon: Tags }, { id: "orders", label: "Orders", icon: ClipboardList },
  ];
  const activeTab = tabs.find((item) => item.id === tab);
  const selectTab = (nextTab: Tab) => { setTab(nextTab); if (nextTab !== "products") setProductEditorOpen(false); };

  return <div className="min-h-screen bg-[#eee8dd] text-[#171512]"><div className="flex min-h-screen">
    <aside className="hidden w-64 shrink-0 bg-[#13110f] px-5 py-7 text-white md:flex md:flex-col">
      <Link href="/" className="font-display text-3xl">Zayaan&apos;s <span className="text-[--gold]">Signature</span></Link>
      <p className="mt-2 font-ui text-[8px] font-bold tracking-[.25em] text-white/42">ATELIER MANAGEMENT</p>
      <button onClick={() => openProductEditor()} className="mt-9 inline-flex items-center justify-center gap-2 bg-[--gold] px-4 py-3.5 font-ui text-[10px] font-bold uppercase tracking-[.16em] text-black transition-transform active:scale-[.97]"><PackagePlus size={15} /> Add product</button>
      <nav className="mt-7 space-y-1">{tabs.map((item) => <button key={item.id} onClick={() => selectTab(item.id)} className={`flex w-full items-center gap-3 px-3 py-3 font-ui text-[10px] font-bold uppercase tracking-[.15em] ${tab === item.id ? "bg-[--gold] text-black" : "text-white/62 hover:bg-white/8 hover:text-white"}`}><item.icon size={15} /> {item.label}</button>)}</nav>
      <div className="mt-auto"><a href={API_BASE} target="_blank" rel="noreferrer" className="font-ui text-[9px] uppercase tracking-[.14em] text-white/40 hover:text-[--gold]">API health</a><button onClick={() => { sessionStorage.removeItem(TOKEN_KEY); setToken(""); }} className="mt-5 block font-ui text-[9px] font-bold uppercase tracking-[.15em] text-white/45 hover:text-white">Sign out</button></div>
    </aside>
    <main className="min-w-0 flex-1 px-5 py-6 pb-28 sm:px-8 lg:px-12 md:pb-7"><header className="flex flex-wrap items-end justify-between gap-5 border-b border-black/12 pb-6"><div><p className="section-kicker">Atelier operations</p><h1 className="mt-3 font-display text-5xl">{activeTab?.label}</h1></div><div className="flex items-center gap-4"><Link href="/" className="font-ui text-[10px] font-bold uppercase tracking-[.15em] text-black/53 hover:text-[#8f6b2c]">View boutique</Link><button onClick={() => void refresh()} className="min-h-11 border border-black/15 px-3 py-2 font-ui text-[10px] font-bold uppercase tracking-[.14em] hover:border-[#8f6b2c]">Refresh</button></div></header>
      {loading && <BrandedLoading size="compact" label={LOADING_COPY.admin} className="mt-6 justify-start border-0 bg-transparent px-0" />}
      {tab === "overview" && <OverviewPanel overview={overview} openProductEditor={() => openProductEditor()} />}
      {tab === "products" && <ProductPanel form={form} setForm={setForm} categories={categories} products={products} editingId={editingId} editorOpen={productEditorOpen} openEditor={openProductEditor} closeEditor={closeProductEditor} save={saveProduct} />}
      {tab === "categories" && <CategoryPanel categories={categories} name={categoryName} setName={setCategoryName} create={createCategory} saveImage={updateCategoryImage} />}
      {tab === "orders" && <OrderPanel orders={orders} updateOrder={updateOrder} createCourierConsignment={createCourierConsignment} refreshCourierStatus={refreshCourierStatus} courierAction={courierAction} />}
    </main>
  </div><nav aria-label="Administrator sections" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-black/12 bg-[#f8f4ed]/95 px-2 py-2 shadow-[0_-10px_30px_rgba(23,21,18,.10)] backdrop-blur md:hidden">{tabs.map((item) => <button key={item.id} onClick={() => selectTab(item.id)} className={`flex min-h-14 flex-col items-center justify-center gap-1 px-1 font-ui text-[8px] font-bold uppercase tracking-[.1em] ${tab === item.id ? "text-[#8f6b2c]" : "text-black/45"}`}><item.icon size={17} strokeWidth={tab === item.id ? 2 : 1.6} />{item.label}</button>)}</nav></div>;
}

function AdminLogin({ username, password, setUsername, setPassword, loading, onSubmit }: { username: string; password: string; setUsername: (value: string) => void; setPassword: (value: string) => void; loading: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="min-h-screen bg-[#11100e] px-5 py-10 text-[#f6f1e9]"><div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md place-items-center"><form onSubmit={onSubmit} className="w-full border border-white/12 bg-[#1b1916] p-7 sm:p-9"><div className="grid h-11 w-11 place-items-center border border-[--gold]/50 text-[--gold]"><LockKeyhole size={19} /></div><p className="mt-7 font-ui text-[10px] font-bold uppercase tracking-[.23em] text-[--gold]">Private access</p><h1 className="mt-4 font-display text-5xl leading-none">Atelier console.</h1><p className="mt-5 font-ui text-sm leading-6 text-white/58">Use the private administrator credentials configured for the store.</p><Input label="Username" value={username} onChange={setUsername} dark required /><Input label="Password" type="password" value={password} onChange={setPassword} dark required /><button disabled={loading} className="gold-button mt-8 w-full justify-center disabled:opacity-50">{loading ? <BrandedLoading size="inline" label={LOADING_COPY.signIn} /> : <><LockKeyhole size={15} /><span>Enter dashboard</span></>}</button><Link href="/" className="mt-5 block text-center font-ui text-[10px] font-bold uppercase tracking-[.16em] text-white/45 hover:text-[--gold]">Return to boutique</Link></form></div></div>;
}

function OverviewPanel({ overview, openProductEditor }: { overview: Overview | null; openProductEditor: () => void }) {
  return <section className="mt-8"><div className="border border-[#8f6b2c]/35 bg-[#171512] p-6 text-white sm:p-8"><p className="font-ui text-[9px] font-bold uppercase tracking-[.2em] text-[--gold]">Product management</p><div className="mt-3 flex flex-wrap items-end justify-between gap-5"><div><h2 className="font-display text-4xl">Ready to add a new piece?</h2><p className="mt-2 max-w-xl font-ui text-sm leading-6 text-white/60">Open the product editor to set the category, price, stock, image URLs and fashion information before publishing.</p></div><button onClick={openProductEditor} className="inline-flex min-h-12 items-center gap-2 bg-[--gold] px-5 font-ui text-[10px] font-bold uppercase tracking-[.16em] text-black"><PackagePlus size={16} /> Add product</button></div></div><div className="mt-4 grid gap-4 md:grid-cols-3">{[{ label: "Published pieces", value: overview?.productCount ?? 0 }, { label: "Open orders", value: overview?.openOrders ?? 0 }, { label: "Low stock alerts", value: overview?.lowStock ?? 0 }].map((card) => <article key={card.label} className="border border-black/12 bg-[#f8f4ed] p-6"><p className="font-ui text-[10px] font-bold uppercase tracking-[.16em] text-black/50">{card.label}</p><p className="mt-5 font-display text-6xl leading-none text-[#8f6b2c]">{card.value}</p></article>)}</div></section>;
}

function ProductPanel({ form, setForm, categories, products, editingId, editorOpen, openEditor, closeEditor, save }: { form: ProductForm; setForm: (value: ProductForm) => void; categories: Category[]; products: Product[]; editingId: number | null; editorOpen: boolean; openEditor: (product?: Product) => void; closeEditor: () => void; save: (event: FormEvent<HTMLFormElement>) => void }) {
  const change = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => setForm({ ...form, [key]: value });
  return <section className={`mt-8 grid gap-8 ${editorOpen ? "xl:grid-cols-[.92fr_1.08fr]" : ""}`}>{editorOpen && <form id="product-editor" onSubmit={save} className="scroll-mt-24 border border-[#8f6b2c]/35 bg-[#f8f4ed] p-5 sm:p-7"><div className="flex justify-between gap-4"><div><p className="font-ui text-[9px] font-bold uppercase tracking-[.19em] text-[#8f6b2c]">Product editor</p><h2 className="mt-2 font-display text-4xl">{editingId ? "Edit product" : "Add product"}</h2><p className="mt-3 max-w-md font-ui text-xs leading-5 text-black/55">Paste an approved main image URL from the GitHub asset library or your own hosted image. Use the gallery field for additional product views.</p><a href={ASSET_LIBRARY_URL} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 font-ui text-[9px] font-bold uppercase tracking-[.14em] text-[#8f6b2c] hover:text-black"><Link2 size={13} /> Open image asset library</a></div><button type="button" onClick={closeEditor} className="grid h-11 w-11 shrink-0 place-items-center border border-black/15 text-black/55 hover:border-[#8f6b2c] hover:text-[#8f6b2c]" aria-label="Close product editor"><X size={18} /></button></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><Input label="Product name" value={form.name} onChange={(value) => change("name", value)} required /><Input label="SKU" value={form.sku} onChange={(value) => change("sku", value)} /><Select label="Category" value={form.categoryId} onChange={(value) => change("categoryId", value)} options={[{ value: "", label: "Uncategorised" }, ...categories.map((category) => ({ value: String(category.id), label: category.name }))]} /><Select label="Visibility" value={form.status} onChange={(value) => change("status", value as ProductForm["status"])} options={[{ value: "draft", label: "Draft — hidden" }, { value: "active", label: "Active — visible" }, { value: "archived", label: "Archived" }]} /><Input label="Price (BDT)" type="number" value={form.price} onChange={(value) => change("price", value)} required /><Input label="VAT label" value={form.vatNote} onChange={(value) => change("vatNote", value)} /><Input label="Compare-at price (BDT)" type="number" value={form.compareAt} onChange={(value) => change("compareAt", value)} /><Input label="Available stock" type="number" value={form.stock} onChange={(value) => change("stock", value)} required /><Input label="Fabric" value={form.fabric} onChange={(value) => change("fabric", value)} /><Input label="Fit" value={form.fitInfo} onChange={(value) => change("fitInfo", value)} /><Input label="Lead time" value={form.leadTime} onChange={(value) => change("leadTime", value)} /><Input label="Availability note" value={form.availabilityNote} onChange={(value) => change("availabilityNote", value)} /><Input label="Sizes — comma separated" value={form.sizes} onChange={(value) => change("sizes", value)} /><Input label="Colours — comma separated" value={form.colours} onChange={(value) => change("colours", value)} /><Toggle label="Feature on collection" checked={form.featured} onChange={(value) => change("featured", value)} /><Toggle label="Online try-on / consultation" checked={form.tryOnEnabled} onChange={(value) => change("tryOnEnabled", value)} /></div><Input label="Main image URL" value={form.imageUrl} onChange={(value) => change("imageUrl", value)} /><Input label="Gallery image URLs — comma separated" value={form.gallery} onChange={(value) => change("gallery", value)} /><TextArea label="Short introduction" value={form.summary} onChange={(value) => change("summary", value)} rows={2} /><TextArea label="Detailed product information" value={form.description} onChange={(value) => change("description", value)} rows={4} /><TextArea label="Size guide" value={form.sizeGuide} onChange={(value) => change("sizeGuide", value)} rows={3} /><TextArea label="Wash care" value={form.washCare} onChange={(value) => change("washCare", value)} rows={3} /><button className="gold-button mt-7 min-h-13 w-full justify-center"><PackagePlus size={16} /> {editingId ? "Save product changes" : "Add product to boutique"}</button></form>}<div className="overflow-hidden border border-black/12 bg-[#f8f4ed]"><div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/12 p-5 sm:p-7"><div><p className="font-ui text-[9px] font-bold uppercase tracking-[.19em] text-[#8f6b2c]">Your catalogue</p><h2 className="mt-2 font-display text-4xl">Products</h2><p className="mt-2 font-ui text-xs text-black/52">Open any product to change price, category, image URL or availability.</p></div><button onClick={() => openEditor()} className="inline-flex min-h-11 items-center gap-2 border border-[#8f6b2c] px-4 font-ui text-[10px] font-bold uppercase tracking-[.14em] text-[#8f6b2c] hover:bg-[#8f6b2c] hover:text-white"><Plus size={15} /> Add product</button></div><div className="divide-y divide-black/10">{products.map((product) => <article key={product.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><img src={productImage(product)} alt="" className="h-28 w-full bg-[#ded6ca] object-cover sm:h-20 sm:w-16" /><div className="min-w-0 flex-1"><p className="font-display text-2xl leading-none">{product.name}</p><p className="mt-2 font-ui text-[10px] uppercase tracking-[.14em] text-black/48">{product.status} · {product.stock} in stock · {formatBdt(product.priceMinor)}</p><p className="mt-1 font-ui text-[10px] uppercase tracking-[.12em] text-black/42">{product.categoryName || "Uncategorised"}</p></div><button onClick={() => openEditor(product)} className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#8f6b2c]/60 px-4 font-ui text-[10px] font-bold uppercase tracking-[.13em] text-[#8f6b2c] transition-colors hover:bg-[#8f6b2c] hover:text-white sm:min-h-10"><PencilLine size={15} /> Edit product <ChevronRight size={14} /></button></article>)}{!products.length && <div className="p-8 text-center"><PackagePlus className="mx-auto text-[#8f6b2c]" size={28} /><p className="mt-4 font-display text-3xl">Your boutique is ready.</p><p className="mx-auto mt-2 max-w-sm font-ui text-sm leading-6 text-black/55">Add the first product with a category, price, image URL and availability. It remains hidden until you choose Active.</p><button onClick={() => openEditor()} className="mt-6 inline-flex min-h-12 items-center gap-2 bg-[#171512] px-5 font-ui text-[10px] font-bold uppercase tracking-[.15em] text-white"><PackagePlus size={16} /> Add first product</button></div>}</div></div></section>;
}

function CategoryPanel({ categories, name, setName, create, saveImage }: { categories: Category[]; name: string; setName: (value: string) => void; create: (event: FormEvent<HTMLFormElement>) => void; saveImage: (id: number, imageUrl: string) => void }) {
  return <section className="mt-8 grid gap-8 lg:grid-cols-[.75fr_1.25fr]"><form onSubmit={create} className="h-fit border border-black/12 bg-[#f8f4ed] p-6"><p className="font-ui text-[9px] font-bold uppercase tracking-[.19em] text-[#8f6b2c]">Collection structure</p><h2 className="mt-2 font-display text-4xl">New category</h2><p className="mt-3 font-ui text-xs leading-5 text-black/55">The supplied women’s and kids’ hierarchy is already available. Add a new category only when the collection expands.</p><Input label="Category name" value={name} onChange={setName} required /><button className="gold-button mt-6 w-full justify-center">Create category</button></form><div className="border border-black/12 bg-[#f8f4ed] p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-ui text-[9px] font-bold uppercase tracking-[.19em] text-[#8f6b2c]">Image URLs</p><h2 className="mt-2 font-display text-4xl">Current categories</h2></div><a href={ASSET_LIBRARY_URL} target="_blank" rel="noreferrer" className="border border-[#8f6b2c]/50 px-3 py-2 font-ui text-[9px] font-bold uppercase tracking-[.13em] text-[#8f6b2c] hover:bg-[#8f6b2c] hover:text-white">Open asset library</a></div><p className="mt-4 max-w-xl font-ui text-xs leading-5 text-black/55">Each category has an image URL. Paste a new approved URL and save it; a managed editorial image is used whenever no custom image is present.</p><div className="mt-6 divide-y divide-black/10">{categories.map((category) => <CategoryImageRow key={category.id} category={category} saveImage={saveImage} />)}{!categories.length && <p className="pt-6 font-ui text-sm text-black/55">Create the women&apos;s and kids&apos; categories for the boutique.</p>}</div></div></section>;
}

function CategoryImageRow({ category, saveImage }: { category: Category; saveImage: (id: number, imageUrl: string) => void }) {
  const [imageUrl, setImageUrl] = useState(category.imageUrl);
  useEffect(() => setImageUrl(category.imageUrl), [category.imageUrl]);
  return <article className="grid gap-4 py-5 sm:grid-cols-[4.5rem_1fr_auto] sm:items-center"><img src={categoryImage({ ...category, imageUrl })} alt="" className="h-20 w-full bg-[#ded6ca] object-cover sm:w-[4.5rem]" /><div className="min-w-0"><p className="font-ui text-sm font-semibold">{category.name}</p><p className="mt-1 font-ui text-[9px] uppercase tracking-[.12em] text-black/42">{category.parentLabel} · /{category.slug}</p><input aria-label={`${category.name} image URL`} value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Paste category image URL" className="mt-3 min-h-11 w-full border border-black/16 bg-white/60 px-3 py-2 text-xs outline-none focus:border-[#8f6b2c]" /></div><button type="button" onClick={() => saveImage(category.id, imageUrl)} className="min-h-11 border border-[#8f6b2c]/60 px-4 font-ui text-[9px] font-bold uppercase tracking-[.12em] text-[#8f6b2c] hover:bg-[#8f6b2c] hover:text-white">Save image</button></article>;
}

const orderStatuses = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];

function CourierControls({ order, createCourierConsignment, refreshCourierStatus, courierAction }: { order: AdminOrder; createCourierConsignment: (id: number) => void; refreshCourierStatus: (id: number) => void; courierAction: string | null }) {
  const hasConsignment = Boolean(order.courier_consignment_id || order.courier_tracking_code);
  const creating = courierAction === `create-${order.id}`;
  const refreshing = courierAction === `status-${order.id}`;
  if (!hasConsignment) return <button type="button" disabled={creating} onClick={() => createCourierConsignment(order.id)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[#171512] px-3 font-ui text-[9px] font-bold uppercase tracking-[.12em] text-white hover:bg-[#8f6b2c] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto">{creating ? <BrandedLoading size="inline" tone="dark" label={LOADING_COPY.courierCreate} /> : <><Truck size={13} /><span>Create consignment</span></>}</button>;
  return <div className="rounded-sm border border-[#8f6b2c]/25 bg-[#f4eee3] p-3"><p className="font-ui text-[9px] font-bold uppercase tracking-[.13em] text-[#8f6b2c]">Consignment #{order.courier_consignment_id || "—"}</p><p className="mt-1 font-ui text-xs font-semibold text-black">Tracking: {order.courier_tracking_code || "Pending"}</p><p className="mt-1 font-ui text-[10px] uppercase tracking-[.13em] text-black/50">Delivery: {order.courier_status?.replace(/_/g, " ") || "Awaiting refresh"}</p><button type="button" disabled={refreshing} onClick={() => refreshCourierStatus(order.id)} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-[#8f6b2c]/60 px-3 font-ui text-[9px] font-bold uppercase tracking-[.12em] text-[#8f6b2c] hover:bg-[#8f6b2c] hover:text-white disabled:cursor-not-allowed disabled:opacity-50">{refreshing ? <BrandedLoading size="inline" label={LOADING_COPY.courierStatus} /> : <><RefreshCw size={13} /><span>Refresh status</span></>}</button></div>;
}

function OrderPanel({ orders, updateOrder, createCourierConsignment, refreshCourierStatus, courierAction }: { orders: AdminOrder[]; updateOrder: (id: number, status: string) => void; createCourierConsignment: (id: number) => void; refreshCourierStatus: (id: number) => void; courierAction: string | null }) {
  const courierProps = { createCourierConsignment, refreshCourierStatus, courierAction };
  return <section className="mt-8 overflow-hidden border border-black/12 bg-[#f8f4ed]"><div className="border-b border-black/12 px-5 py-5 sm:px-7"><p className="font-ui text-[9px] font-bold uppercase tracking-[.19em] text-[#8f6b2c]">Order fulfilment</p><h2 className="mt-2 font-display text-4xl">Orders &amp; courier</h2><p className="mt-2 max-w-2xl font-ui text-xs leading-5 text-black/55">Create a Steadfast consignment only after you have reviewed the customer&apos;s order. Tracking references and delivery status stay private in this dashboard.</p></div><div className="divide-y divide-black/10 md:hidden">{orders.map((order) => <article key={order.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-ui text-[9px] font-bold uppercase tracking-[.13em] text-[#8f6b2c]">{order.order_no}</p><p className="mt-2 font-display text-2xl leading-none">{order.customer_name}</p><p className="mt-2 font-ui text-xs text-black/52">{order.customer_phone} · {formatBdt(order.total_minor)}</p></div><select aria-label={`Order status for ${order.order_no}`} value={order.status} onChange={(event) => updateOrder(order.id, event.target.value)} className="min-h-10 border border-black/15 bg-transparent px-2 py-1.5 text-xs capitalize outline-none focus:border-[#8f6b2c]">{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select></div><div className="mt-4"><CourierControls order={order} {...courierProps} /></div></article>)}{!orders.length && <p className="px-5 py-12 text-center font-ui text-sm text-black/52">No customer orders have been placed yet.</p>}</div><div className="hidden overflow-x-auto md:block"><table className="min-w-[940px] w-full text-left"><thead className="border-b border-black/12 bg-[#e8e0d3] font-ui text-[10px] font-bold uppercase tracking-[.15em] text-black/55"><tr><th className="px-5 py-4">Order</th><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Total</th><th className="px-5 py-4">Order status</th><th className="px-5 py-4">Steadfast courier</th></tr></thead><tbody className="font-ui text-sm">{orders.map((order) => <tr key={order.id} className="border-b border-black/8 align-top"><td className="px-5 py-5 font-bold">{order.order_no}</td><td className="px-5 py-5"><span className="block">{order.customer_name}</span><span className="text-xs text-black/45">{order.customer_phone}</span></td><td className="px-5 py-5">{formatBdt(order.total_minor)}</td><td className="px-5 py-5"><select value={order.status} onChange={(event) => updateOrder(order.id, event.target.value)} className="min-h-10 border border-black/15 bg-transparent px-2 py-1.5 text-xs capitalize outline-none focus:border-[#8f6b2c]">{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select></td><td className="px-5 py-5"><CourierControls order={order} {...courierProps} /></td></tr>)}{!orders.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-black/52">No customer orders have been placed yet.</td></tr>}</tbody></table></div></section>;
}

function Input({ label, value, onChange, type = "text", required = false, dark = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; dark?: boolean }) { return <label className={`mt-5 block font-ui text-[10px] font-bold uppercase tracking-[.14em] ${dark ? "text-white/70" : ""}`}>{label}<input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} className={`mt-2 min-h-12 w-full border px-3 py-2.5 text-sm outline-none ${dark ? "border-white/25 bg-transparent text-white focus:border-[--gold]" : "border-black/16 bg-white/60 focus:border-[#8f6b2c]"}`} /></label>; }
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) { return <label className="mt-5 block font-ui text-[10px] font-bold uppercase tracking-[.14em]">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-12 w-full border border-black/16 bg-white/60 px-3 py-2.5 text-sm outline-none focus:border-[#8f6b2c]">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function TextArea({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) { return <label className="mt-5 block font-ui text-[10px] font-bold uppercase tracking-[.14em]">{label}<textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border border-black/16 bg-white/60 px-3 py-2.5 text-sm outline-none focus:border-[#8f6b2c]" /></label>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="mt-5 flex min-h-12 items-center gap-3 border border-black/16 bg-white/60 px-3 font-ui text-[10px] font-bold uppercase tracking-[.12em]"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#8f6b2c]" /> {label}</label>; }
