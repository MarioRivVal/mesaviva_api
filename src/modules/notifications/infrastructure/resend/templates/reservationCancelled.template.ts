import { ReservationCancelledParams } from '@modules/notifications/domain/ports/email.service.port';

export function getReservationCancelledTemplate(
  params: ReservationCancelledParams,
): string {
  return `
<h1>Reserva Cancelada</h1>

<p>Hola ${params.customerName} ${params.customerLastName},</p>

<p>Tu reserva en <strong>${params.restaurantName}</strong> ha sido <strong>cancelada</strong> correctamente.</p>

<h2>Detalles de la Reserva Cancelada:</h2>
<ul>
<li><strong>Fecha:</strong> ${params.date}</li>
<li><strong>Hora:</strong> ${params.time}</li>
<li><strong>Personas:</strong> ${params.numberOfPeople}</li>
</ul>

<p>Si deseas hacer una nueva reserva puedes hacerlo en cualquier momento.</p>

<hr>
<p><small>Email automático de MesaViva</small></p>
`;
}
