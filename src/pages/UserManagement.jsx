import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Mail, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function UserManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(email.trim().toLowerCase(), role);
      toast.success(`Invite sent to ${email}. They will receive an email to set their password.`);
      setEmail('');
      setRole('user');
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err) {
      toast.error(err?.message || 'Failed to send invite. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Invite staff and manage who has access to AccuBooks</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">System Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No users yet. Invite your first team member.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground text-xs">Name</th>
                    <th className="pb-2 font-medium text-muted-foreground text-xs">Email</th>
                    <th className="pb-2 font-medium text-muted-foreground text-xs">Role</th>
                    <th className="pb-2 font-medium text-muted-foreground text-xs">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 font-medium flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        {u.full_name || '—'}
                      </td>
                      <td className="py-3 text-muted-foreground">{u.email}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.role === 'admin' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {u.role === 'admin' && <Shield className="w-3 h-3" />}
                          {u.role === 'admin' ? 'Admin' : 'Employee'}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground text-xs">
                        {u.created_date ? format(new Date(u.created_date), 'dd MMM yyyy') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              They will receive an email with a link to register and choose their own password.
            </p>
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="colleague@company.co.za"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Employee — can create &amp; process documents</SelectItem>
                  <SelectItem value="admin">Admin — full access including settings &amp; users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={inviting}>
                <Mail className="w-4 h-4 mr-2" />
                {inviting ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}