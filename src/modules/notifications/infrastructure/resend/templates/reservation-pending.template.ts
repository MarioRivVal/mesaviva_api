import { ReservationPendingParams } from '@modules/notifications/domain/ports/email.service.port';

export function getReservationPendingTemplate(
  params: ReservationPendingParams,
): string {
  return `
<h1>Solicitud de Reserva Recibida 🕐</h1>

<p>Hola ${params.customerName} ${params.customerLastName},</p>

<p>Hemos recibido tu solicitud de reserva en <strong>${params.restaurantName}</strong>.
El restaurante la revisará y recibirás una confirmación por email en breve.</p>

<h2>Detalles de tu Solicitud:</h2>
<ul>
<li><strong>Fecha:</strong> ${params.date}</li>
<li><strong>Hora:</strong> ${params.time}</li>
<li><strong>Personas:</strong> ${params.numberOfPeople}</li>
${params.notes ? `<li><strong>Notas:</strong> ${params.notes}</li>` : ''}
</ul>

<p>Te notificaremos cuando el restaurante responda.</p>

<hr>
<p><small>Email automático de MesaViva</small></p>
`;
}
