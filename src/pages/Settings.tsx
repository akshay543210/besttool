import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useAccounts } from "@/hooks/useAccounts"
import { Plus, Trash2, DollarSign, TrendingUp, Settings as SettingsIcon } from "lucide-react"

const Settings = () => {
  const { accounts, loading, createAccount, updateAccount, deleteAccount, setActiveAccount, getActiveAccount } = useAccounts()
  const [newAccountName, setNewAccountName] = useState("")
  const [newAccountBalance, setNewAccountBalance] = useState("10000")
  const [editingAccount, setEditingAccount] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const activeAccount = getActiveAccount()

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) return
    
    const balance = parseFloat(newAccountBalance)
    
    if (isNaN(balance) || balance <= 0) return

    await createAccount(newAccountName, balance, 2.0) // Default risk percentage
    setNewAccountName("")
    setNewAccountBalance("10000")
    setIsAddDialogOpen(false)
  }

  const handleUpdateAccount = async () => {
    if (!editingAccount) return

    const balance = parseFloat(editingAccount.current_balance)
    
    if (isNaN(balance) || balance <= 0) return

    await updateAccount(editingAccount.id, {
      name: editingAccount.name,
      current_balance: balance,
      starting_balance: parseFloat(editingAccount.starting_balance) || 0,
      risk_per_trade: editingAccount.risk_per_trade, // Keep existing risk percentage
    })
    setEditingAccount(null)
    setIsEditDialogOpen(false)
  }

  const handleDeleteAccount = async (accountId: string) => {
    await deleteAccount(accountId)
  }

  const openEditDialog = (account: any) => {
    setEditingAccount({ ...account })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your trading accounts and portfolio settings</p>
        </div>
        <SettingsIcon className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* Active Account Summary */}
      {activeAccount && (
        <Card className="bg-gradient-primary border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Active Account: {activeAccount.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-primary-foreground/80">Current Balance:</span>
              <span className="text-xl font-bold text-primary-foreground">
                ${activeAccount.current_balance.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-primary-foreground/80">P&L:</span>
              <span className={`font-semibold ${
                activeAccount.current_balance >= activeAccount.starting_balance 
                  ? 'text-success' 
                  : 'text-destructive'
              }`}>
                {activeAccount.current_balance >= activeAccount.starting_balance ? '+' : ''}
                ${(activeAccount.current_balance - activeAccount.starting_balance).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Account Management */}
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Trading Accounts
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-border hover:bg-muted">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-card-foreground">Create New Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="accountName" className="text-card-foreground">Account Name</Label>
                    <Input
                      id="accountName"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      placeholder="e.g., Main Account, FTMO Challenge"
                      className="bg-input border-border text-card-foreground"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountBalance" className="text-card-foreground">Starting Balance ($)</Label>
                    <Input
                      id="accountBalance"
                      type="number"
                      value={newAccountBalance}
                      onChange={(e) => setNewAccountBalance(e.target.value)}
                      placeholder="10000"
                      className="bg-input border-border text-card-foreground"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleCreateAccount}
                      className="flex-1 bg-primary hover:bg-primary/90"
                      disabled={!newAccountName.trim()}
                    >
                      Create Account
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                      className="border-border hover:bg-muted"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading accounts...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No accounts yet. Create your first trading account to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div 
                  key={account.id} 
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-card-foreground">{account.name}</h3>
                      {account.is_active && (
                        <Badge variant="default" className="bg-success text-success-foreground">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Balance: </span>
                        <span className="text-card-foreground font-medium">
                          ${account.current_balance.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Starting: </span>
                        <span className="text-card-foreground font-medium">
                          ${account.starting_balance.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">P&L: </span>
                        <span className={`font-medium ${
                          account.current_balance >= account.starting_balance 
                            ? 'text-success' 
                            : 'text-destructive'
                        }`}>
                          {account.current_balance >= account.starting_balance ? '+' : ''}
                          ${(account.current_balance - account.starting_balance).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={account.is_active ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveAccount(account.id)}
                      disabled={account.is_active}
                      className={account.is_active ? 
                        "bg-success hover:bg-success/90 text-success-foreground" : 
                        "border-border hover:bg-muted text-xs"
                      }
                    >
                      {account.is_active ? "Active" : "Set Active"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(account)}
                      className="border-border hover:bg-muted"
                    >
                      Edit
                    </Button>
                    {accounts.length > 1 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-card-foreground">Delete Account</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              Are you sure you want to delete "{account.name}"? This action cannot be undone 
                              and will remove all associated trade history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border hover:bg-muted">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteAccount(account.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Edit Account</DialogTitle>
          </DialogHeader>
          {editingAccount && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editAccountName" className="text-card-foreground">Account Name</Label>
                <Input
                  id="editAccountName"
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({...editingAccount, name: e.target.value})}
                  className="bg-input border-border text-card-foreground"
                />
              </div>
              <div>
                <Label htmlFor="editAccountBalance" className="text-card-foreground">Current Balance ($)</Label>
                <Input
                  id="editAccountBalance"
                  type="number"
                  value={editingAccount.current_balance}
                  onChange={(e) => setEditingAccount({...editingAccount, current_balance: parseFloat(e.target.value) || 0})}
                  className="bg-input border-border text-card-foreground"
                />
              </div>
              <div>
                <Label htmlFor="editStartingBalance" className="text-card-foreground">Starting Balance ($)</Label>
                <Input
                  id="editStartingBalance"
                  type="number"
                  value={editingAccount.starting_balance}
                  onChange={(e) => setEditingAccount({...editingAccount, starting_balance: parseFloat(e.target.value) || 0})}
                  className="bg-input border-border text-card-foreground"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleUpdateAccount}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={!editingAccount.name?.trim()}
                >
                  Update Account
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-border hover:bg-muted"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Settings