import { format, parseISO } from 'date-fns'
import type { SegmentKey } from '@/lib/segments'

export type MessageContext = {
  clientName: string
  lastService: string | null
  daysSince: number | null
  salonName: string
  professionalName: string
  benefitText: string | null
  validity: string | null
}

const returnTemplates = [
  'Oi, {nome}! Aqui é a {profissional}, do {salao} 💛 Seu {ultimo_servico} foi há {dias} dias e já está na época de retocar. Vamos agendar essa semana?',
  'Oi, {nome}, tudo bem? Estava olhando sua ficha e seu {ultimo_servico} já está pedindo manutenção 😊 Qual dia fica melhor pra você?',
  '{nome}! Aqui é a {profissional}, do {salao}. Passando pra lembrar que seu {ultimo_servico} está na época de renovar — posso reservar um horário pra você? 💛',
]

const reactivationTemplates = [
  'Oi, {nome}, tudo bem? Aqui é a {profissional}, do {salao}. Lembrei de você hoje e vim dar um oi 💛 Quando quiser voltar a se cuidar, vou adorar te receber!',
  '{nome}! Saudade de te ver por aqui 😊 Aqui é a {profissional}, do {salao}. Quando quiser voltar, é só me chamar que preparo algo especial pra você.',
  'Oi, {nome}! Quanto tempo, né? Aqui é a {profissional}, do {salao} 💛 Se estiver pensando em voltar, me responde aqui que a gente combina!',
]

const newClientTemplates = [
  'Oi, {nome}! Adorei te receber no {salao} 😊 Como ficou seu {ultimo_servico}? Quero saber!',
  '{nome}, seja muito bem-vinda ao {salao} 💛 Aqui é a {profissional}. Me conta: gostou do resultado do seu {ultimo_servico}?',
  'Oi, {nome}! Aqui é a {profissional}, do {salao}. Obrigada pela confiança na primeira visita 😊 Deu tudo certo com seu {ultimo_servico}?',
]

const birthdayTemplates = [
  'Parabéns, {nome}!! 🎂 Que seu dia seja lindo e cheio de carinho. Quando quiser passar aqui pra comemorar, te espero 💛 Beijo, {profissional} — {salao}',
  '{nome}, feliz aniversário!! 🎉 Muita saúde e alegria pra você. Esse mês é todo seu — quando vier ao salão, o abraço é por minha conta 😊',
  'Feliz aniversário, {nome}! 🥳 Que seu novo ano seja maravilhoso. É uma delícia ter você como cliente do {salao} 💛',
]

const birthdayBenefitTemplates = [
  'Parabéns, {nome}! 🎂 E tem presente: você ganhou {beneficio}, válido até {validade}. Quando quer vir aproveitar?',
  '{nome}, feliz aniversário!! 🎉 Que seu dia seja lindo. Pra comemorar, o {salao} preparou um mimo: {beneficio}, válido até {validade} 💛',
  'Feliz aniversário, {nome}! 🥳 Pra celebrar, preparei {beneficio} pra você, válido até {validade}. Vamos agendar?',
]

function fillTemplate(template: string, ctx: MessageContext): string {
  const firstName = ctx.clientName.trim().split(/\s+/)[0] || ctx.clientName
  return template
    .replaceAll('{nome}', firstName)
    .replaceAll('{ultimo_servico}', ctx.lastService ?? 'último atendimento')
    .replaceAll('{dias}', String(ctx.daysSince ?? ''))
    .replaceAll('{salao}', ctx.salonName)
    .replaceAll('{profissional}', ctx.professionalName)
    .replaceAll('{beneficio}', ctx.benefitText ?? '')
    .replaceAll('{validade}', ctx.validity ?? '')
}

export function buildMessage(segment: SegmentKey, ctx: MessageContext): string {
  let templates: string[]
  if (segment === 'birthday') {
    templates = ctx.benefitText ? birthdayBenefitTemplates : birthdayTemplates
  } else if (segment === 'return') {
    templates = returnTemplates
  } else if (segment === 'reactivation') {
    templates = reactivationTemplates
  } else {
    templates = newClientTemplates
  }

  const template = templates[Math.floor(Math.random() * templates.length)]
  return fillTemplate(template, ctx)
}

export function buildBenefitText(salon: {
  bday_benefit_type: string
  bday_benefit_value: number | null
  bday_benefit_desc: string | null
}): string | null {
  switch (salon.bday_benefit_type) {
    case 'percent':
      return salon.bday_benefit_value != null
        ? `${salon.bday_benefit_value}% de desconto`
        : null
    case 'amount':
      return salon.bday_benefit_value != null
        ? `R$ ${salon.bday_benefit_value} de desconto`
        : null
    case 'free_service':
      return salon.bday_benefit_desc ? `${salon.bday_benefit_desc} de presente` : null
    case 'other':
      return salon.bday_benefit_desc || null
    default:
      return null
  }
}

export function formatValidity(dateStr: string | null): string | null {
  if (!dateStr) return null
  return format(parseISO(dateStr), 'dd/MM')
}

export function waLink(whatsapp: string, message: string): string {
  const digits = whatsapp.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}