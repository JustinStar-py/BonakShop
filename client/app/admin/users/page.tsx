"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { useSimpleToast } from "@/components/ui/toast-notification";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pen2Linear as Edit, WalletLinear as Wallet, MagniferLinear as Search, RestartLinear as Loader2 } from "@solar-icons/react-perf";
import { formatToToman } from "@/utils/currencyFormatter";
import TomanPrice from "@/components/shared/TomanPrice";

export default function UsersPage() {
  const toast = useSimpleToast();
  const [users, setUsers] = useState<Array<{
    id: string;
    name?: string | null;
    phone: string;
    userType: string;
    role: string;
    balance: number;
    shopName?: string | null;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit State
  const [editingUser, setEditingUser] = useState<typeof users[0] | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Charge State
  const [chargingUser, setChargingUser] = useState<typeof users[0] | null>(null);
  const [chargeAmount, setChargeAmount] = useState("");
  const [walletOperation, setWalletOperation] = useState<'increase' | 'decrease'>('increase');
  const [isChargeOpen, setIsChargeOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get("/admin/users");
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await apiClient.put(`/admin/users/${editingUser.id}`, editingUser);
      toast.success("کاربر با موفقیت ویرایش شد");
      setIsEditOpen(false);
      fetchUsers();
    } catch {
      toast.error("خطا در ویرایش کاربر");
    }
  };

  const handleChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargingUser || !chargeAmount) return;
    try {
      const amount = walletOperation === 'decrease' ? -Math.abs(Number(chargeAmount)) : Number(chargeAmount);
      await apiClient.post(`/admin/users/${chargingUser.id}/wallet`, { amount });
      toast.success(walletOperation === 'decrease' ? `${formatToToman(Math.abs(Number(chargeAmount)))} از کیف پول کسر شد` : `کیف پول با موفقیت شارژ شد!`);
      setIsChargeOpen(false);
      setChargeAmount("");
      setWalletOperation('increase');
      fetchUsers();
    } catch {
      toast.error("خطا در تغییر موجودی کیف پول");
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone.includes(searchTerm)
  );

  if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت کاربران</h1>
        <div className="relative w-64">
          <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="جستجو نام یا شماره..."
            className="pr-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-right">نام</TableHead>
              <TableHead className="text-right">شماره تماس</TableHead>
              <TableHead className="text-right">نوع کاربر</TableHead>
              <TableHead className="text-right">نقش</TableHead>
              <TableHead className="text-right">موجودی کیف پول</TableHead>
              <TableHead className="text-center">عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name || "---"}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${user.userType === 'SHOP_OWNER' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {user.userType === 'SHOP_OWNER' ? 'فروشگاه‌دار' : 'کاربر عادی'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                    user.role === 'WORKER' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                    {user.role === 'ADMIN' ? 'مدیر' : user.role === 'WORKER' ? 'کارمند' : 'مشتری'}
                  </span>
                </TableCell>
                <TableCell>
                  <TomanPrice value={Number(user.balance)} />
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditingUser(user); setIsEditOpen(true); }}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setChargingUser(user); setIsChargeOpen(true); }}
                      className="text-green-600 hover:bg-green-50"
                    >
                      <Wallet size={18} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ویرایش کاربر</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>نام</Label>
                <Input
                  value={editingUser.name || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>شماره تماس</Label>
                <Input
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>نام فروشگاه</Label>
                <Input
                  value={editingUser.shopName || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, shopName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>نقش</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(val) => setEditingUser({ ...editingUser, role: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">مشتری</SelectItem>
                    <SelectItem value="WORKER">کارمند</SelectItem>
                    <SelectItem value="ADMIN">مدیر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>نوع کاربر</Label>
                <Select
                  value={editingUser.userType}
                  onValueChange={(val) => setEditingUser({ ...editingUser, userType: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHOP_OWNER">فروشگاه‌دار</SelectItem>
                    <SelectItem value="INDIVIDUAL">کاربر عادی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">ذخیره تغییرات</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Charge Dialog */}
      <Dialog open={isChargeOpen} onOpenChange={setIsChargeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>شارژ کیف پول</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChargeSubmit} className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500 mb-1">موجودی فعلی</p>
              <TomanPrice
                value={chargingUser ? Number(chargingUser.balance) : 0}
                className="text-xl font-bold"
              />
            </div>

            {/* Operation Type Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setWalletOperation('increase')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${walletOperation === 'increase'
                  ? 'bg-green-600 text-white shadow'
                  : 'text-gray-600 hover:bg-gray-200'
                  }`}
              >
                ✓ افزایش موجودی
              </button>
              <button
                type="button"
                onClick={() => setWalletOperation('decrease')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${walletOperation === 'decrease'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-gray-600 hover:bg-gray-200'
                  }`}
              >
                ✗ کسر موجودی
              </button>
            </div>
            <div className="space-y-2">
              <Label>{walletOperation === 'increase' ? 'مبلغ افزایش (تومان)' : 'مبلغ کسر (تومان)'}</Label>
              <Input
                type="number"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                placeholder="مثلا: 100000"
              />
            </div>
            <Button
              type="submit"
              className={`w-full ${walletOperation === 'increase' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {walletOperation === 'increase' ? '✓ افزایش موجودی' : '✗ کسر موجودی'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
