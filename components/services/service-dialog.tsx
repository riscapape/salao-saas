'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteService, saveService } from '@/app/app/servicos/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type ServiceData = {
  id: string
  name: string
  price: number | null
  cycle_days: number
}

const formSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do serviço'),
  price: z.string(),
  cycleDays: z.string().min(1, 'Informe o ciclo em dias'),
})

type FormValues = z.infer<typeof formSchema>

export function ServiceDialog({
  service,
  canDelete = false,
}: {
  service?: ServiceData
  canDelete?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const isEditing = !!service

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: service?.name ?? '',
      price: service?.price != null ? String(service.price) : '',
      cycleDays: String(service?.cycle_days ?? 30),
    },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await saveService({ id: service?.id, ...values })
    if (result?.error) {
      setServerError(result.error)
      return
    }
    toast.success(isEditing ? 'Serviço atualizado.' : 'Serviço criado.')
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!service) return
    if (!window.confirm('Excluir este serviço? Essa ação não pode ser desfeita.')) return
    setDeleting(true)
    const result = await deleteService(service.id)
    setDeleting(false)
    if (result?.error) {
      toast.error(result.error)
      return
    }
    toast.success('Serviço excluído.')
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      {isEditing ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo serviço
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
            <DialogDescription>
              O ciclo é apenas uma sugestão: o retorno é definido em cada atendimento.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Nome</Label>
              <Input id="service-name" placeholder="Ex.: Corte feminino" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service-price">Preço (R$)</Label>
                <Input
                  id="service-price"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  placeholder="80,00"
                  {...register('price')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service-cycle">Retorno sugerido (dias)</Label>
                <Input
                  id="service-cycle"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  {...register('cycleDays')}
                />
              </div>
            </div>
            {errors.cycleDays && (
              <p className="text-sm text-destructive">{errors.cycleDays.message}</p>
            )}
            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            <DialogFooter className="gap-2 sm:justify-between">
              {isEditing && canDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}