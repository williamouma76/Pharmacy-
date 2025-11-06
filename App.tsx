import React, { useState, useEffect } from 'react';
import { Product, CartItem, Order } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { INITIAL_PRODUCTS } from './constants';
import {
    CapsuleIcon, MessageSquareIcon, RefreshCwIcon, ShoppingCartIcon, UploadCloudIcon,
    MapPinIcon, CheckCircleIcon, XIcon, PlusIcon, MinusIcon, Trash2Icon, SettingsIcon,
    ArrowRightIcon, HeartIcon, HomeIcon, UserIcon, ChevronLeftIcon, TrendingUpIcon,
    TrendingDownIcon, DollarSignIcon, PackageIcon, MoonIcon, TagIcon
} from './components/icons';
import Toast from './components/Toast';
import Modal from './components/Modal';

// --- New Design System Colors ---
const PRIMARY_COLOR = '#2E8B57'; // Updated to Primary Teal

// --- Helper Functions ---
const formatTZS = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(amount);
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// --- Child Components defined outside parent ---

const ProductCard: React.FC<{ product: Product; onAddToCart: (product: Product) => void; onViewDetails: (product: Product) => void; }> = ({ product, onAddToCart, onViewDetails }) => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col group transition-shadow hover:shadow-lg">
        <div onClick={() => onViewDetails(product)} className="relative pt-[100%] bg-gray-50 overflow-hidden cursor-pointer">
             <img src={product.image} alt={product.name} className="absolute top-0 left-0 w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"/>
             <button className="absolute top-2 right-2 bg-white/70 backdrop-blur-sm p-1.5 rounded-full text-gray-500 hover:text-red-500 transition-colors">
                <HeartIcon className="w-5 h-5" />
             </button>
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <h3 onClick={() => onViewDetails(product)} className="font-semibold text-base text-gray-800 cursor-pointer h-12">{product.name}</h3>
            <p className="text-gray-500 text-sm mt-1">{product.dosage}</p>
            <div className="flex justify-between items-center mt-4">
                <span className="font-bold text-lg text-gray-900">{formatTZS(product.price)}</span>
                 <button onClick={() => onAddToCart(product)} style={{ backgroundColor: PRIMARY_COLOR }} className="text-white w-9 h-9 flex items-center justify-center rounded-full hover:opacity-90 transition-opacity">
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
);

const ProductDetailModal: React.FC<{
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (product: Product, quantity: number) => void;
}> = ({ product, isOpen, onClose, onAddToCart }) => {
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (isOpen) {
            setQuantity(1); // Reset quantity when modal opens
        }
    }, [isOpen]);

    if (!product) return null;

    const handleAddToCartClick = () => {
        onAddToCart(product, quantity);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Details">
            <div className="space-y-4">
                <div className="bg-gray-100 rounded-2xl p-4 h-64 flex items-center justify-center">
                    <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain"/>
                </div>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                        <p className="text-gray-500">{product.dosage}</p>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{formatTZS(product.price)}</span>
                </div>
                <p className="text-gray-600">{product.description}</p>
                
                <div className="flex items-center justify-between py-4">
                    <p className="font-semibold">Quantity</p>
                    <div className="flex items-center space-x-3 bg-gray-100 rounded-full p-1">
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 rounded-full bg-white shadow-sm"><MinusIcon className="w-4 h-4" /></button>
                        <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                        <button onClick={() => setQuantity(q => q + 1)} className="p-2 rounded-full bg-white shadow-sm"><PlusIcon className="w-4 h-4" /></button>
                    </div>
                </div>

                <button onClick={handleAddToCartClick} style={{ backgroundColor: PRIMARY_COLOR }} className="w-full text-white font-bold py-4 rounded-2xl text-lg hover:opacity-90 transition-opacity">
                    Add to Cart
                </button>
            </div>
        </Modal>
    );
};


const SuccessAnimation = () => (
    <div className="text-center py-10 flex flex-col items-center">
        <div className="w-24 h-24 text-green-500 animate-pulse-slow">
            <CheckCircleIcon className="w-full h-full" />
        </div>
        <h2 className="text-2xl font-bold mt-4 text-gray-900">Order Confirmed!</h2>
        <p className="text-gray-600 mt-2">Oda yako imetumwa kwa duka la dawa.</p>
    </div>
);

// --- Admin Panel Component ---

interface AdminPanelProps {
    isAdminLoggedIn: boolean;
    password: string;
    adminError: string;
    products: Product[];
    editingProduct: Product | null;
    onLogin: () => void;
    onLogout: () => void;
    onBackToShop: () => void;
    onPasswordChange: (pw: string) => void;
    onAdminErrorChange: (err: string) => void;
    onProductsChange: React.Dispatch<React.SetStateAction<Product[]>>;
    onEditingProductChange: React.Dispatch<React.SetStateAction<Product | null>>;
    onShowToast: (msg: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
    isAdminLoggedIn, password, adminError, products, editingProduct,
    onLogin, onLogout, onBackToShop, onPasswordChange, onAdminErrorChange,
    onProductsChange, onEditingProductChange, onShowToast
}) => {
    const [adminView, setAdminView] = useState<'dashboard' | 'products'>('dashboard');
    const [newProduct, setNewProduct] = useState<Omit<Product, 'id' | 'featured'>>({ name: '', price: 0, description: '', stock: 0, image: '', dosage: '', category: '' });

    // MOCK ANALYTICS DATA
    const mockAnalytics = {
        monthlyRevenue: 12_550_000,
        prevMonthRevenue: 11_800_000,
        totalOrders: 482,
        prevTotalOrders: 450,
        aov: 26037,
        nightExpressOrders: 95,
        lowStockItems: products.filter(p => p.stock < 20).slice(0, 10),
        activePromotions: [
            { id: 'promo1', name: 'Flu Season Bundle', details: 'Buy Cough Syrup & Vitamin C, get 10% off.' },
            { id: 'promo2', name: 'Pain Relief Special', details: 'Buy 2 Paracetamol, get 1 free.' },
        ],
        bestSellers: [
            { name: 'Paracetamol', units: 310 }, { name: 'Ibuprofen', units: 250 }, { name: 'Vitamin C', units: 180 }, { name: 'Cough Syrup', units: 155 }, { name: 'Amoxicillin', units: 98 },
        ],
        orderTimeDistribution: { day: 387, night: 95 },
        customerLoyalty: 38,
    };
    
    const revenueChange = ((mockAnalytics.monthlyRevenue - mockAnalytics.prevMonthRevenue) / mockAnalytics.prevMonthRevenue) * 100;
    const ordersChange = ((mockAnalytics.totalOrders - mockAnalytics.prevTotalOrders) / mockAnalytics.prevTotalOrders) * 100;

    const handleSaveProduct = () => {
        if (editingProduct) {
            onProductsChange(products.map(p => p.id === editingProduct.id ? editingProduct : p));
            onShowToast('Product updated!');
            onEditingProductChange(null);
        } else {
            const productToAdd: Product = { ...newProduct, id: `prod_${Date.now()}`};
            onProductsChange([productToAdd, ...products]);
            onShowToast('Product added!');
            setNewProduct({ name: '', price: 0, description: '', stock: 0, image: '', dosage: '', category: '' });
        }
    };

    const handleDeleteProduct = (productId: string) => {
         if (window.confirm('Are you sure you want to delete this product?')) {
            onProductsChange(products.filter(p => p.id !== productId));
            onShowToast('Product deleted.');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await fileToBase64(e.target.files[0]);
            if (isEditing && editingProduct) {
                onEditingProductChange({ ...editingProduct, image: base64 });
            } else {
                setNewProduct({ ...newProduct, image: base64 });
            }
        }
    };

    const Scorecard: React.FC<{ title: string; value: string; change?: number; icon: React.ReactNode; }> = ({ title, value, change, icon }) => (
        <div className="bg-[#2a303c] p-6 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <p className="text-lg font-semibold text-gray-300">{title}</p>
                <div className="text-[#2E8B57]">{icon}</div>
            </div>
            <div>
                <p className="text-4xl font-bold text-white mt-2">{value}</p>
                {change !== undefined && (
                    <div className={`flex items-center mt-1 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? <TrendingUpIcon className="w-4 h-4 mr-1" /> : <TrendingDownIcon className="w-4 h-4 mr-1" />}
                        <span>{change.toFixed(1)}% vs last month</span>
                    </div>
                )}
            </div>
        </div>
    );

    if (!isAdminLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full text-center">
                    <CapsuleIcon className="w-12 h-12 mx-auto text-gray-400 mb-2"/>
                    <h1 className="text-2xl font-bold mb-4">Baypharm TZ Admin</h1>
                    <input type="password" value={password} 
                        onChange={(e) => {
                            onPasswordChange(e.target.value);
                            if (adminError) onAdminErrorChange('');
                        }} 
                        onKeyDown={(e) => e.key === 'Enter' && onLogin()} 
                        placeholder="Password"
                        className={`w-full border rounded-xl p-3 mb-2 focus:outline-none focus:ring-2 transition-colors ${
                            adminError 
                            ? 'border-red-400 ring-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-[#2E8B57]'
                        }`}
                    />
                    {adminError && <p className="text-red-500 text-sm mb-4">{adminError}</p>}
                    <button onClick={onLogin} style={{backgroundColor: PRIMARY_COLOR}} className="w-full text-white font-bold py-3 rounded-xl hover:opacity-90">Login</button>
                    <button onClick={onBackToShop} className="w-full mt-2 text-gray-600 font-medium py-2 rounded-xl hover:bg-gray-100">Back to Shop</button>
                </div>
            </div>
        );
    }
    
    const formProduct = editingProduct ?? newProduct;
    const updateForm = (updates: Partial<Omit<Product, 'id' | 'featured'>>) => {
        if (editingProduct) {
            onEditingProductChange(p => p ? {...p, ...updates} : null);
        } else {
            setNewProduct(p => ({...p, ...updates}));
        }
    };

    return (
        <div className="bg-[#1d232a] text-gray-200 min-h-screen">
            <header className="bg-[#2a303c] p-4 shadow-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-6">
                        <h1 className="text-2xl font-bold text-white flex items-center"><CapsuleIcon className="w-7 h-7 mr-2 text-[#2E8B57]"/> PharmaLink</h1>
                        <nav className="hidden md:flex space-x-2 bg-[#1d232a] p-1 rounded-lg">
                            <button onClick={() => setAdminView('dashboard')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${adminView === 'dashboard' ? 'bg-[#2E8B57] text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Dashboard</button>
                            <button onClick={() => setAdminView('products')} className={`px-4 py-2 text-sm font-semibold rounded-md transition ${adminView === 'products' ? 'bg-[#2E8B57] text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Products</button>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={onBackToShop} className="font-semibold py-2 px-4 rounded-lg text-gray-200 bg-gray-600 hover:bg-gray-500 transition-colors text-sm">Back to Shop</button>
                        <button onClick={onLogout} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm">Logout</button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 md:p-6">
                {adminView === 'dashboard' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-[#2a303c] p-6 rounded-2xl shadow-lg">
                                <h3 className="text-xl font-bold text-white mb-4">Low Stock Alerts</h3>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {mockAnalytics.lowStockItems.length > 0 ? mockAnalytics.lowStockItems.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-[#1d232a] p-3 rounded-lg">
                                            <div><p className="font-semibold text-gray-200">{item.name}</p><p className="text-sm text-gray-400">Est. 5 days of supply left</p></div>
                                            <span className="font-bold text-lg text-yellow-400">{item.stock}</span>
                                        </div>
                                    )) : <p className="text-gray-400">No items with low stock.</p>}
                                </div>
                            </div>
                            <div className="bg-[#2a303c] p-6 rounded-2xl shadow-lg">
                                <h3 className="text-xl font-bold text-white mb-4">Active Promotions</h3>
                                <div className="space-y-4">
                                    {mockAnalytics.activePromotions.map(promo => (
                                        <div key={promo.id} className="border-l-4 border-[#4CAF50] bg-[#1d232a] p-4 rounded-r-lg"><p className="font-semibold text-gray-200">{promo.name}</p><p className="text-sm text-gray-400">{promo.details}</p></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Scorecard title="Total Monthly Revenue" value={formatTZS(mockAnalytics.monthlyRevenue)} change={revenueChange} icon={<DollarSignIcon className="w-6 h-6"/>} />
                                <Scorecard title="Total Orders Processed" value={mockAnalytics.totalOrders.toString()} change={ordersChange} icon={<PackageIcon className="w-6 h-6"/>} />
                                <Scorecard title="Average Order Value" value={formatTZS(mockAnalytics.aov)} icon={<ShoppingCartIcon className="w-6 h-6"/>} />
                                <Scorecard title="Night Express Orders" value={mockAnalytics.nightExpressOrders.toString()} icon={<MoonIcon className="w-6 h-6"/>} />
                            </div>
                            <div className="bg-[#2a303c] p-6 rounded-2xl shadow-lg">
                                <h3 className="text-xl font-bold text-white mb-4">Best Selling Products</h3>
                                <div className="space-y-3">
                                    {mockAnalytics.bestSellers.map((item, index) => (
                                        <div key={index} className="flex items-center"><p className="w-1/3 text-gray-300 truncate">{item.name}</p><div className="w-2/3 bg-[#1d232a] rounded-full h-6"><div className="bg-[#2E8B57] h-6 rounded-full text-right pr-2 text-white text-sm flex items-center justify-end" style={{ width: `${(item.units / mockAnalytics.bestSellers[0].units) * 100}%` }}>{item.units}</div></div></div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#2a303c] p-6 rounded-2xl shadow-lg flex flex-col items-center">
                                    <h3 className="text-xl font-bold text-white mb-4">Order Time Distribution</h3>
                                    <div className="relative w-40 h-40 rounded-full flex items-center justify-center" style={{background: `conic-gradient(#2E8B57 0% ${ (mockAnalytics.orderTimeDistribution.day / mockAnalytics.totalOrders) * 100 }%, #4CAF50 ${ (mockAnalytics.orderTimeDistribution.day / mockAnalytics.totalOrders) * 100 }% 100%)`}}><div className="absolute w-28 h-28 bg-[#2a303c] rounded-full"></div></div>
                                    <div className="flex justify-around w-full mt-4 text-sm"><div className="text-center"><span className="w-3 h-3 bg-[#2E8B57] inline-block rounded-full mr-1"></span>Day <p className="font-bold">{mockAnalytics.orderTimeDistribution.day}</p></div><div className="text-center"><span className="w-3 h-3 bg-[#4CAF50] inline-block rounded-full mr-1"></span>Night <p className="font-bold">{mockAnalytics.orderTimeDistribution.night}</p></div></div>
                                </div>
                                <div className="bg-[#2a303c] p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center"><h3 className="text-xl font-bold text-white mb-4">Customer Loyalty</h3><div className="text-6xl font-bold text-[#4CAF50]">{mockAnalytics.customerLoyalty}%</div><p className="text-gray-400 mt-2 text-center">customers placed more than one order in 6 months.</p></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-[#2a303c] p-6 rounded-2xl shadow-lg mb-8">
                            <h2 className="text-2xl font-bold text-white mb-4">{editingProduct ? 'Edit Medicine' : 'Add New Medicine'}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <input type="text" placeholder="Name" value={formProduct.name} onChange={e => updateForm({ name: e.target.value })} className="bg-[#1d232a] border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#2E8B57]"/>
                                <input type="text" placeholder="Dosage (e.g., 500mg)" value={formProduct.dosage || ''} onChange={e => updateForm({ dosage: e.target.value })} className="bg-[#1d232a] border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#2E8B57]"/>
                                <input type="number" placeholder="Price (TZS)" value={formProduct.price} onChange={e => updateForm({ price: parseInt(e.target.value) || 0 })} className="bg-[#1d232a] border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#2E8B57]"/>
                                <input type="number" placeholder="Stock" value={formProduct.stock} onChange={e => updateForm({ stock: parseInt(e.target.value) || 0 })} className="bg-[#1d232a] border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#2E8B57]"/>
                                <textarea placeholder="Description" value={formProduct.description} onChange={e => updateForm({ description: e.target.value })} className="md:col-span-2 bg-[#1d232a] border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#2E8B57] h-24"></textarea>
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, !!editingProduct)} className="md:col-span-2 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2E8B57] file:text-white hover:file:bg-opacity-80"/>
                            </div>
                            <div className="flex justify-end space-x-4">
                                {editingProduct && <button onClick={() => onEditingProductChange(null)} className="font-bold py-2 px-6 rounded-lg bg-gray-600 text-white hover:bg-gray-500">Cancel</button>}
                                <button onClick={handleSaveProduct} className="font-bold py-2 px-6 rounded-lg bg-[#4CAF50] text-white hover:bg-opacity-90">{editingProduct ? 'Save Changes' : 'Add Medicine'}</button>
                            </div>
                        </div>
                        <div className="bg-[#2a303c] rounded-2xl shadow-lg overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-gray-700"><tr><th className="p-4 font-semibold text-gray-300">Name</th><th className="p-4 font-semibold text-gray-300">Price</th><th className="p-4 font-semibold text-gray-300">Stock</th><th className="p-4 font-semibold text-gray-300">Actions</th></tr></thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p.id} className="border-b border-gray-700 hover:bg-[#1d232a]"><td className="p-4 font-medium text-white">{p.name}</td><td className="p-4 text-gray-300">{formatTZS(p.price)}</td><td className="p-4 text-gray-300">{p.stock}</td><td className="p-4 space-x-4"><button onClick={() => { onEditingProductChange(p); setAdminView('products'); }} className="font-medium text-blue-400 hover:underline">Edit</button><button onClick={() => handleDeleteProduct(p.id)} className="font-medium text-red-400 hover:underline">Delete</button></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

// --- Customer View Component ---

interface CustomerViewProps {
    products: Product[];
    cart: CartItem[];
    onAddToCart: (product: Product) => void;
    onViewDetails: (product: Product | null) => void;
    onOpenCart: () => void;
    onSwitchToAdmin: () => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({
    products, cart, onAddToCart, onViewDetails, onOpenCart, onSwitchToAdmin
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Pain Relief', 'Vitamins', 'Cold & Flu', 'Antibiotics', 'Allergies', 'Personal Care', 'Baby Care'];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const statusCards = [
        { title: "Emergency Delivery", subtitle: "10 PM to 6 AM", bg: "bg-indigo-900", text: "text-white" },
        { title: "Never Miss a Dose", subtitle: "Set your medication reminders", bg: "bg-teal-700", text: "text-white" },
        { title: "Welcome Offer", subtitle: "15% off your first delivery!", bg: "bg-amber-500", text: "text-gray-900" }
    ];

    return (
        <div className="bg-white min-h-screen pb-24">
            <header className="p-4 sticky top-0 bg-white/80 backdrop-blur-lg z-30">
                 <div className="flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Search medicine or health issue..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-100 border border-transparent rounded-xl py-3 px-4 focus:outline-none focus:ring-2 ring-inset focus:ring-[#2E8B57]"
                    />
                    <button style={{ backgroundColor: PRIMARY_COLOR }} className="p-3 rounded-full text-white flex-shrink-0">
                        <MessageSquareIcon className="w-6 h-6"/>
                    </button>
                </div>
            </header>

            <main className="px-4 space-y-6">
                <div className="bg-gradient-to-r from-teal-50 to-pink-50 p-4 rounded-2xl flex items-center justify-between transition-shadow hover:shadow-lg">
                    <div>
                        <p className="font-bold text-gray-800">Have a prescription?</p>
                        <p className="text-sm text-gray-600">Upload and get your meds</p>
                    </div>
                    <button style={{backgroundColor: PRIMARY_COLOR}} className="text-white w-10 h-10 flex items-center justify-center rounded-xl">
                        <UploadCloudIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="flex space-x-3 overflow-x-auto pb-2 -mx-4 px-4">
                    {statusCards.map(card => (
                        <div key={card.title} className={`p-4 rounded-xl shadow-sm w-48 flex-shrink-0 ${card.bg} ${card.text}`}>
                            <p className="font-bold">{card.title}</p>
                            <p className="text-sm opacity-90">{card.subtitle}</p>
                        </div>
                    ))}
                </div>

                <div>
                    <div className="flex space-x-4 overflow-x-auto pb-2 -mx-4 px-4">
                         {categories.map(category => (
                            <button key={category} onClick={() => setActiveCategory(category)}
                                className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-colors ${activeCategory === category ? 'bg-[#2E8B57] text-white' : 'bg-gray-100 text-gray-700'}`}>
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} onAddToCart={() => onAddToCart(product)} onViewDetails={onViewDetails} />
                    ))}
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
                <div className="flex justify-around items-center h-16">
                    <button className="flex flex-col items-center gap-1" style={{color: PRIMARY_COLOR}}>
                        <HomeIcon className="w-6 h-6"/> <span className="text-xs font-semibold">Home</span>
                    </button>
                    <button onClick={onOpenCart} className="flex flex-col items-center gap-1 text-gray-500 relative">
                        <ShoppingCartIcon className="w-6 h-6"/> <span className="text-xs font-semibold">Cart</span>
                        {cart.length > 0 && <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>}
                    </button>
                    <button onClick={onSwitchToAdmin} className="flex flex-col items-center gap-1 text-gray-500">
                        <UserIcon className="w-6 h-6"/> <span className="text-xs font-semibold">Admin</span>
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---

type View = 'home' | 'customer' | 'admin';

const App: React.FC = () => {
    const [view, setView] = useState<View>('customer'); // Default to new customer view
    const [products, setProducts] = useLocalStorage<Product[]>('baypharm_products', []);
    const [cart, setCart] = useLocalStorage<CartItem[]>('baypharm_cart', []);
    const [orders, setOrders] = useLocalStorage<Order[]>('baypharm_orders', []);
    
    // UI State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Checkout state
    const [deliveryOption, setDeliveryOption] = useState<'instant' | 'save'>('instant');
    const [prescription, setPrescription] = useState<string | undefined>(undefined);
    const [prescriptionPreview, setPrescriptionPreview] = useState<string | undefined>(undefined);
    const [location, setLocation] = useState<{ lat: number | null, lng: number | null, address: string }>({ lat: null, lng: null, address: '' });
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'success'>('cart');
    
    // Admin state
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
    const [password, setPassword] = useState('');
    const [adminError, setAdminError] = useState('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    useEffect(() => {
        if (products.length === 0) setProducts(INITIAL_PRODUCTS);
    }, []);

    const showToastMessage = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
    };
    
    const handleAddToCart = (product: Product, quantity: number = 1) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item));
        } else {
            setCart([...cart, { ...product, quantity }]);
        }
        showToastMessage('Imeongezwa kwenye kikapu');
    };

    const handleUpdateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            setCart(cart.filter(item => item.id !== productId));
        } else {
            setCart(cart.map(item => item.id === productId ? { ...item, quantity } : item));
        }
    };
    
    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    
    const handleConfirmOrder = () => {
        const newOrder: Order = {
            id: `order_${Date.now()}`,
            items: cart,
            total: cartTotal,
            date: new Date().toISOString(),
            deliveryOption, location, prescription
        };
        setOrders([...orders, newOrder]);
        setCheckoutStep('success');
    };
    
    const handleCloseCart = () => {
        setIsCartOpen(false);
        setTimeout(() => {
            if (checkoutStep === 'success') {
                setCart([]);
                setPrescription(undefined);
                setPrescriptionPreview(undefined);
            }
            setCheckoutStep('cart');
        }, 300);
    };

    const handleAdminLogin = () => {
        if (password === 'admin123') {
            setIsAdminLoggedIn(true);
            setAdminError('');
        } else {
            setAdminError('Incorrect password.');
        }
        setPassword(''); // Clear password after any attempt for security
    };
    
    const renderCartContent = () => {
        if (checkoutStep === 'success') return <SuccessAnimation />;
        if (cart.length === 0) return <p className="text-center text-gray-500 py-8">Your cart is empty.</p>;

        return (
            <div className="space-y-6">
                <div className="space-y-4 max-h-80 overflow-y-auto -mr-2 pr-2">
                    {cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <img src={item.image} alt={item.name} className="w-16 h-16 object-contain rounded-lg bg-gray-100 p-1" />
                                <div>
                                    <p className="font-semibold text-gray-800">{item.name}</p>
                                    <p className="text-sm text-gray-500">{formatTZS(item.price)}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><MinusIcon className="w-4 h-4" /></button>
                                <span className="w-6 text-center font-medium">{item.quantity}</span>
                                <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"><PlusIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between font-bold text-lg text-gray-900"><p>Total</p><p>{formatTZS(cartTotal)}</p></div>
                    <button onClick={handleConfirmOrder} style={{backgroundColor: PRIMARY_COLOR}} className="w-full text-white font-bold py-3 rounded-xl mt-4 hover:opacity-90 transition-opacity">
                       Confirm Order
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <>
            {view === 'customer' && <CustomerView 
                products={products}
                cart={cart}
                onAddToCart={(product) => handleAddToCart(product)}
                onViewDetails={setSelectedProduct}
                onOpenCart={() => setIsCartOpen(true)}
                onSwitchToAdmin={() => setView('admin')}
            />}
            {view === 'admin' && <AdminPanel 
                isAdminLoggedIn={isAdminLoggedIn}
                password={password}
                adminError={adminError}
                products={products}
                editingProduct={editingProduct}
                onLogin={handleAdminLogin}
                onLogout={() => {setIsAdminLoggedIn(false); setPassword('');}}
                onBackToShop={() => setView('customer')}
                onPasswordChange={setPassword}
                onAdminErrorChange={setAdminError}
                onProductsChange={setProducts}
                onEditingProductChange={setEditingProduct}
                onShowToast={showToastMessage}
            />}
            
            <Toast message={toastMessage} show={showToast} onClose={() => setShowToast(false)} />
            
            <Modal isOpen={isCartOpen} onClose={handleCloseCart} title="Your Shopping Cart">
                {renderCartContent()}
            </Modal>

            <ProductDetailModal 
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
                onAddToCart={handleAddToCart}
            />
        </>
    );
};

export default App;
