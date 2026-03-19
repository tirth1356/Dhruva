import { useState, type ElementType, type FC, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Share2,
  User,
  LogOut,
  Menu,
  PlusCircle,
  CheckSquare,
  Wallet,
  Clock,
  Send,
  Lock,
  Bell,
  Search,
  Settings,
  ChevronDown,
  ShieldCheck,
  Activity,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarItem {
  name: string;
  icon: ElementType;
  path: string;
}

interface Notification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export const DashboardLayout: FC = () => {
  const { user, logout } = useAuth();
  const { isActive, connect, disconnect, account } = useWeb3();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "success",
      title: "Credential Issued",
      message: "Your new credential has been successfully issued on the blockchain.",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false
    },
    {
      id: "2",
      type: "info",
      title: "System Update",
      message: "New security features have been added to the platform.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false
    },
    {
      id: "3",
      type: "warning",
      title: "Expiring Soon",
      message: "One of your credentials will expire in 30 days.",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const userItems: SidebarItem[] = [
    { name: "Terminal", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Vault", icon: FileText, path: "/dashboard/credentials" },
    { name: "Upload", icon: Upload, path: "/dashboard/upload" },
    { name: "Request Approval", icon: Send, path: "/dashboard/request-approval" },
    { name: "Approval Status", icon: Clock, path: "/dashboard/approval-status" },
    { name: "Share", icon: Share2, path: "/dashboard/share" },
    { name: "Identity", icon: User, path: "/dashboard/profile" },
  ];

  const orgItems: SidebarItem[] = [
    { name: "Command Center", icon: LayoutDashboard, path: "/org/dashboard" },
    { name: "Issue Asset", icon: PlusCircle, path: "/org/issue" },
    { name: "Registry", icon: FileText, path: "/org/issued" },
    { name: "Approval Requests", icon: Clock, path: "/org/approval" },
    { name: "Validator", icon: CheckSquare, path: "/org/verify" },
    { name: "Authorization", icon: Lock, path: "/org/issuer-auth" },
    { name: "Config", icon: User, path: "/org/profile" },
  ];

  const verifierItems: SidebarItem[] = [
    { name: "Verify Credentials", icon: CheckSquare, path: "/verifier/dashboard" },
  ];

  const adminItems: SidebarItem[] = [
    { name: "Org Approvals", icon: Lock, path: "/admin/dashboard" },
  ];

  const items: SidebarItem[] =
    user?.role === "org" ? orgItems :
      user?.role === "verifier" ? verifierItems :
        user?.role === "admin" ? adminItems :
          userItems;

  const handleLogout = () => {
    disconnect();
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0f0a18] flex font-sans w-full">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0f0a18]/90 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 ease-in-out flex flex-col text-white",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <img src="/DHRUVALOGO.jpeg" alt="Dhruva Logo" className="h-7 w-7 object-cover rounded-lg" />
          <span className="ml-3 text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'Arimo, sans-serif', fontWeight: 700 }}>DHRUVA</span>
        </div>

        <div className="px-3 py-4 flex-1">
          <div className="text-[10px] font-semibold text-[#3DC2EC] uppercase tracking-wider mb-3 px-3 opacity-70">
            Navigation
          </div>
          <nav className="space-y-0.5">
            {items.map((item: SidebarItem) => {
              const Icon = item.icon as React.ComponentType<{ className?: string }>;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsSidebarOpen(false);
                  }}
                  className={clsx(
                    "w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    location.pathname === item.path
                      ? "bg-[#5227FF]/20 text-white border border-[#5227FF]/40"
                      : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent",
                  )}
                >
                  <Icon
                    className={clsx(
                      "w-5 h-5 mr-3",
                      location.pathname === item.path ? "text-[#3DC2EC]" : "text-gray-500 group-hover:text-[#3DC2EC]",
                    )}
                  />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all border border-transparent hover:border-red-500/30"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/10 bg-[#0f0a18]/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs text-[#3DC2EC]">SECURE_NODE</span>
              </div>
              <span className="text-white/30">|</span>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#5227FF]" />
                <span className="font-mono text-xs text-gray-400">Lat: 22ms</span>
              </div>
              <span className="text-white/30">|</span>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="font-mono text-xs text-gray-400">99.9% Uptime</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-500 w-32"
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-[#0f0a18] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-[#3DC2EC] hover:text-[#3DC2EC]/80 transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No notifications</div>
                      ) : (
                        notifications.map((notification) => {
                          const typeColors = {
                            success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                            warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                            error: "bg-red-500/20 text-red-400 border-red-500/30",
                            info: "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          };
                          const typeIcons = {
                            success: CheckSquare,
                            warning: Clock,
                            error: LogOut,
                            info: Bell
                          };
                          const TypeIcon = typeIcons[notification.type];
                          return (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={clsx(
                                "p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer",
                                !notification.read && "bg-white/[0.02]"
                              )}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="flex items-start gap-3">
                                <div className={clsx(
                                  "p-2 rounded-lg border",
                                  typeColors[notification.type]
                                )}>
                                  <TypeIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="text-sm font-medium text-white truncate">{notification.title}</h4>
                                    {!notification.read && (
                                      <span className="w-2 h-2 bg-[#5227FF] rounded-full shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400 line-clamp-2">{notification.message}</p>
                                  <p className="text-[10px] text-gray-500 mt-1">
                                    {notification.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-xs text-[#3DC2EC] capitalize">{user?.role}</p>
                </div>
                <div className="relative">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#5227FF] to-[#3DC2EC] text-white flex items-center justify-center font-bold">
                    {user?.name?.[0] || "U"}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0f0a18]" />
                </div>
                <ChevronDown className={clsx(
                  "w-4 h-4 text-gray-400 transition-transform",
                  showUserMenu && "rotate-180"
                )} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-[#0f0a18] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white">{user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    <div className="p-1">
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-white transition-colors">
                        <User className="w-4 h-4" />
                        Profile
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-300 hover:text-white transition-colors">
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <div className="h-px bg-white/10 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {!isActive ? (
            <div className="max-w-md mx-auto">
              <div className="rounded-2xl border border-white/10 bg-[#0f0a18]/80 backdrop-blur-xl p-8 text-center">
                <Wallet className="w-14 h-14 text-[#3DC2EC] mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Connect your wallet</h2>
                <p className="text-sm text-gray-400 mb-6">
                  Connect MetaMask (or compatible wallet) to use the dashboard and sign transactions.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await connect();
                    } catch (error: any) {
                      alert(error.message || "Failed to connect wallet");
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-[#5227FF] text-white font-semibold hover:bg-[#3DC2EC] hover:text-[#0f0a18] transition-all border border-[#5227FF]/50"
                >
                  Connect wallet
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom duration-300">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
