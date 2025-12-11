"use client";
import { useState, useEffect } from "react";
import {
  BankSection,
  BankSectionContent,
  BankSectionHeader,
  BankSectionButton
} from "../_components/BankSection";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/primitives/button";
import { changeActiveAccount, formatMoney } from "../bankUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/primitives/dialog";
import { Input } from "@/components/ui/primitives/input";
import { AccountImage } from "../_components/AccountImage";
import useStarBank from "../_hooks/useStarBank";
import { useBoffSession } from "@/services/useBoffSession";
import { useCreateAccount } from "@/hooks/starbank/useCreateAccount";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { 
  PlusCircleIcon, 
  CreditCardIcon, 
  BanknotesIcon, 
  ArrowPathIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import { SummaryCard } from "../_components/SummaryCard";
import { Label } from "@/components/ui/primitives/label";
import ImageUpload from "@/components/ui/primitives/image-upload";

export default function Cuentas() {
  const { session } = useBoffSession();
  const { accounts, setAccounts, activeAccount, setActiveAccount, fetchAccounts } = useStarBank();
  const [isCreating, setIsCreating] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [accountImage, setAccountImage] = useState<File | null>(null);
  const { createAccount, isLoading: createLoading } = useCreateAccount();

  // Calculate account statistics
  const totalBalance = accounts?.reduce((sum: number, account: any) => sum + account.balance, 0) || 0;
  const primaryAccounts = accounts?.filter((acc: any) => acc.type === "MAIN") || [];
  const secondaryAccounts = accounts?.filter((acc: any) => acc.type === "SECONDARY") || [];

  // Check if user already has a MAIN account
  const hasMainAccount = primaryAccounts.length > 0;

  // Create new account handler
  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) {
      toast.error("Por favor, ingrese un nombre para la cuenta");
      return;
    }
    
    setIsCreating(true);
    
    try {
      const res =await createAccount({
        name: newAccountName.trim(),
        uuid: session?.user.smartRotomUser?.uuid!
      }, accountImage ? { image: accountImage } : {});

      setNewAccountName("");
      setAccountImage(null);
      fetchAccounts(session);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error("Error al crear la cuenta");
    } finally {
      setIsCreating(false);
    }
  };

  const handleImageSelect = (file: File) => {
    setAccountImage(file);
  };

  const handleImageRemove = () => {
    setAccountImage(null);
  };

  // Select account handler
  const handleSelectAccount = (accountId: number) => {
    setActiveAccount(changeActiveAccount(accountId));
  };

  return (
    <div className="max-w-[90%] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header with summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BankSection className="md:col-span-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Mis Cuentas</h1>
              <p className="text-blue-600">Administra tus cuentas bancarias</p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <BankSectionButton className="flex items-center">
                  <PlusCircleIcon className="h-5 w-5 mr-2" />
                  Nueva Cuenta Secundaria
                </BankSectionButton>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nueva Cuenta Secundaria</DialogTitle>
                  <DialogDescription>
                    Ingresa los datos para crear una nueva cuenta secundaria.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Info Alert */}
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mr-2" />
                    <p className="text-sm text-blue-700">
                      Las cuentas secundarias te permiten organizar tu dinero para diferentes propósitos como ahorros, gastos diarios, viajes, etc.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="account-name">Nombre de la cuenta</Label>
                    <Input
                      id="account-name"
                      placeholder="Ej: Ahorros, Gastos, etc."
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Imagen de la cuenta (opcional)</Label>
                    <ImageUpload
                      onImageSelect={handleImageSelect}
                      onImageRemove={handleImageRemove}
                      value={accountImage}
                      maxSizeInMB={2}
                      placeholder="Sube una imagen personalizada para tu cuenta"
                      className="w-full"
                      disabled={isCreating}
                    />
                  </div>
                  
                  <div className="flex items-center p-3 rounded-lg border border-blue-200 bg-blue-50">
                    <BanknotesIcon className="h-8 w-8 text-blue-700 mr-3" />
                    <div>
                      <h4 className="font-medium text-blue-900">Cuenta Secundaria</h4>
                      <p className="text-xs text-blue-600">
                        Ideal para ahorrar o separar fondos para fines específicos
                      </p>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isCreating}
                    className="border-blue-200"
                  >
                    Cancelar
                  </Button>
                  <BankSectionButton
                    onClick={handleCreateAccount}
                    disabled={isCreating || !newAccountName.trim()}
                  >
                    {isCreating ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Creando...
                      </>
                    ) : (
                      "Crear cuenta secundaria"
                    )}
                  </BankSectionButton>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </BankSection>
        
        <SummaryCard 
          title="Balance Total"
          value={formatMoney(totalBalance)}
          icon={<CreditCardIcon className="h-6 w-6" />}
          className="md:col-span-1"
        />
        
        <SummaryCard 
          title="Cuenta Principal"
          value={primaryAccounts.length > 0 ? primaryAccounts[0].name : "No disponible"}
          icon={<CreditCardIcon className="h-6 w-6" />}
          className="md:col-span-1"
        />
        
        <SummaryCard 
          title="Cuentas Secundarias"
          value={`${secondaryAccounts.length} ${secondaryAccounts.length === 1 ? 'cuenta' : 'cuentas'}`}
          icon={<BanknotesIcon className="h-6 w-6" />}
          className="md:col-span-1"
        />
      </div>

      {/* Main Account Card */}
      {primaryAccounts.length > 0 && (
        <BankSection className="bg-gradient-to-r from-blue-800 to-blue-600 text-white">
          <BankSectionHeader>Cuenta Principal</BankSectionHeader>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <AccountImage 
                    type={primaryAccounts[0].type} 
                    name={primaryAccounts[0].name} 
                    width={64} 
                    height={64} 
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {primaryAccounts[0].name}
                  </h3>
                  <div className="flex items-center">
                    <p className="text-lg text-blue-100">
                      Balance: <span className="font-bold">{formatMoney(primaryAccounts[0].balance)}</span>
                    </p>
                    <span className="mx-2 text-blue-300">•</span>
                    <p className="text-sm text-blue-100">
                      Cuenta Principal
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleSelectAccount(primaryAccounts[0].id)}
                className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  activeAccount?.id === primaryAccounts[0].id
                    ? "bg-white text-blue-700"
                    : "bg-blue-700 text-white border border-blue-300 hover:bg-blue-800"
                }`}
              >
                {activeAccount?.id === primaryAccounts[0].id ? "Seleccionada" : "Seleccionar"}
              </button>
            </div>
          </div>
        </BankSection>
      )}

      {/* blue Accounts List */}
      <BankSection className="min-h-[400px]">
        <div className="flex justify-between items-center mb-4">
          <BankSectionHeader>Cuentas Secundarias</BankSectionHeader>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchAccounts(session)}
              className="text-blue-700 hover:text-blue-900 flex items-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Actualizar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsDialogOpen(true)}
              className="text-blue-700 border-blue-200 hover:bg-blue-50 flex items-center"
            >
              <PlusCircleIcon className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
        </div>
        
        <AccountsList 
          accounts={secondaryAccounts} 
          activeAccount={activeAccount} 
          onSelect={handleSelectAccount} 
        />
        
        {secondaryAccounts.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-center bg-blue-50 rounded-lg border border-dashed border-blue-200">
            <BanknotesIcon className="h-12 w-12 text-blue-300 mb-3" />
            <h3 className="text-lg font-medium text-blue-800 mb-1">No tienes cuentas secundarias</h3>
            <p className="text-sm text-blue-600 max-w-md mb-4">
              Crea cuentas secundarias para organizar tu dinero según tus necesidades.
            </p>
            <BankSectionButton
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Crear Cuenta Secundaria
            </BankSectionButton>
          </div>
        )}
      </BankSection>
    </div>
  );
}

function AccountsList({ 
  accounts, 
  activeAccount, 
  onSelect 
}: { 
  accounts: any[], 
  activeAccount: any, 
  onSelect: (id: number) => void 
}) {
  if (!accounts || accounts.length === 0) {
    return null;
  }

  return (
    <div className="divide-y divide-blue-100 rounded-md border border-blue-200 overflow-hidden bg-white">
      {accounts.map((account: any) => (
        <div
          key={account.id}
          className="p-4 hover:bg-blue-50 transition duration-150 ease-in-out"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <AccountImage type={account.type} name={account.name} image={(account as any).image} width={56} height={56} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-950">
                  {account.name}
                </h3>
                <div className="flex items-center">
                  <p className="text-sm text-blue-700">
                    Balance: <span className="font-semibold">{formatMoney(account.balance)}</span>
                  </p>
                  <span className="mx-2 text-blue-300">•</span>
                  <p className="text-xs text-blue-500">
                    Cuenta Secundaria
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => onSelect(account.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                activeAccount?.id === account.id
                  ? "bg-blue-700 text-white"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
            >
              {activeAccount?.id === account.id ? "Seleccionada" : "Seleccionar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}