'use client'

import { useActionState } from 'react'
import { createSalon } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function OnboardingForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(createSalon, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Bem-vinda! 💅</CardTitle>
          <CardDescription>
            {email} — vamos configurar seu salão para começar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Seu nome</Label>
              <Input
                id="ownerName"
                name="ownerName"
                placeholder="Como as clientes te chamam"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salonName">Nome do salão</Label>
              <Input
                id="salonName"
                name="salonName"
                placeholder="Studio Bella"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp do salão</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Configurando...' : 'Começar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}