import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { electronBridge, type Category } from "@/lib/electronBridge";
import { queryKeys } from "@/lib/queryKeys";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CategoryManager() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: queryKeys.categories.all,
    queryFn: () => electronBridge.getAllCategories(),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => electronBridge.createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      setNewCategoryName("");
      toast({
        title: "Kategorie vytvořena",
        description: "Nová kategorie byla úspěšně přidána",
      });
    },
    onError: (error) => {
      toast({
        title: "Chyba",
        description: error instanceof Error ? error.message : "Nepodařilo se vytvořit kategorii",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      electronBridge.updateCategory(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      setEditingId(null);
      setEditingName("");
      toast({
        title: "Kategorie upravena",
        description: "Kategorie byla úspěšně aktualizována",
      });
    },
    onError: (error) => {
      toast({
        title: "Chyba",
        description: error instanceof Error ? error.message : "Nepodařilo se upravit kategorii",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => electronBridge.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      toast({
        title: "Kategorie smazána",
        description: "Kategorie byla úspěšně odstraněna",
      });
    },
    onError: (error) => {
      toast({
        title: "Chyba",
        description: error instanceof Error ? error.message : "Nepodařilo se smazat kategorii",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (newCategoryName.trim()) {
      createCategoryMutation.mutate(newCategoryName.trim());
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      updateCategoryMutation.mutate({ id: editingId, name: editingName.trim() });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = (id: string) => {
    deleteCategoryMutation.mutate(id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Správa kategorií">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Správa kategorií</DialogTitle>
          <DialogDescription>
            Přidejte, upravte nebo odstraňte kategorie produktů
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Přidat novou kategorii */}
          <div className="flex gap-2">
            <Input
              placeholder="Název nové kategorie"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
            <Button
              onClick={handleCreate}
              disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Seznam kategorií */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Načítání...
              </p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Žádné kategorie
              </p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-2 p-2 rounded-md border bg-card"
                >
                  {editingId === category.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        className="flex-1 h-8"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleSaveEdit}
                        disabled={!editingName.trim() || updateCategoryMutation.isPending}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{category.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(category.id)}
                        disabled={deleteCategoryMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
