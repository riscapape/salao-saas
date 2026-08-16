'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Pencil, Plus } from 'lucide-react'
import { saveClient } from '@/app/app/clientes/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type ClientData = {
  id: string
  name: string
  whatsapp: string
  birthday: string | null
  notes: string | null
}

const formSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome'),
  whatsapp: z.string().min(10, 'WhatsApp incompleto'),
  birthday: z.string(),
  notes: z.string(),
})

type FormValues = z.infer<typeof formSchema>

export function ClientDialog({ client }: { client?: ClientData }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const isEditing = !!client

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name ?? '',
      whatsapp: client?.whatsapp ?? '',
      birthday: client?.birthday ?? '',
      notes: client?.notes ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const result = await saveClient({ id: client?.id, ...values })
    if (result?.error) {
      setServerError(result.error)
      return
    }
    toast.success(isEditing ? 'Cliente atualizada.' : 'Cliente cadastrada.')
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
          <Plus className="mr-2 h-4 w-4" /> Nova cliente
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar cliente' : 'Nova cliente'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Atualize os dados da cliente.'
                : 'Cadastre uma nova cliente do salão.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome</Label>
              <Input id="client-name" placeholder="Nome da cliente" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-whatsapp">WhatsApp</Label>
              <Input
                id="client-whatsapp"
                type="tel"
                placeholder="(11) 99999-9999"
                {...register('whatsapp')}
              />
              {errors.whatsapp && (
                <p className="text-sm text-destructive">{errors.whatsapp.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-birthday">Aniversário</Label>
              <Input id="client-birthday" type="date" {...register('birthday')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-notes">Observações</Label>
              <Textarea
                id="client-notes"
                placeholder="Preferências, alergias, gosta de conversar..."
                rows={3}
                {...register('notes')}
              />
            </div>
            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            <DialogFooter>
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