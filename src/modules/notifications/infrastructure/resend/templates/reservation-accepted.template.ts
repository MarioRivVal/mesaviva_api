import { ReservationAcceptedParams } from '../../../application/ports/email.service.port';

export function getReservationAcceptedTemplate(
  params: ReservationAcceptedParams,
): string {
  return `
<h1>¡Reserva Confirmada! ✅</h1>

<p>Hola ${params.customerName} ${params.customerLastName},</p>

<p>Tu reserva en <strong>${params.restaurantName}</strong> ha sido <strong>confirmada</strong>.</p>

<h2>Detalles de tu Reserva:</h2>
<ul>
<li><strong>Fecha:</strong> ${params.date}</li>
<li><strong>Hora:</strong> ${params.time}</li>
<li><strong>Personas:</strong> ${params.numberOfPeople}</li>
${params.notes ? `<li><strong>Notas:</strong> ${params.notes}</li>` : ''}
</ul>

<p>¡Te esperamos!</p>

<hr>
<p><small>Email automático de MesaViva</small></p>
`;
}
