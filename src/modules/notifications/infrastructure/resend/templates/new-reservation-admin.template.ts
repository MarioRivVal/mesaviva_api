import { NewReservationAdminParams } from '@modules/notifications/application/ports/email.service.port';

export function getNewReservationAdminTemplate(
  params: NewReservationAdminParams,
): string {
  return `
<h1>${params.isAutoConfirmed ? '✅ Nueva Reserva Confirmada' : '🔔 Nueva Reserva Pendiente'}</h1>

<p>Hola <strong>${params.restaurantName}</strong>,</p>

<p>${
    params.isAutoConfirmed
      ? 'Has recibido una <strong>nueva reserva confirmada automáticamente</strong>.'
      : 'Has recibido una <strong>nueva solicitud de reserva</strong> que requiere tu aprobación.'
  }</p>

<h2>Detalles de la Reserva:</h2>
<ul>
<li><strong>Fecha:</strong> ${params.date}</li>
<li><strong>Hora:</strong> ${params.time}</li>
<li><strong>Personas:</strong> ${params.numberOfPeople}</li>
${params.notes ? `<li><strong>Notas:</strong> ${params.notes}</li>` : ''}
</ul>

<h2>Datos del Cliente:</h2>
<ul>
<li><strong>Nombre:</strong> ${params.customerName} ${params.customerLastName}</li>
<li><strong>Email:</strong> ${params.customerEmail}</li>
<li><strong>Teléfono:</strong> ${params.customerPhone}</li>
</ul>

<p>${
    params.isAutoConfirmed
      ? 'Puedes ver esta reserva en tu panel de administración.'
      : '<strong>Acción requerida:</strong> Accede a tu panel para aceptar o rechazar esta reserva.'
  }</p>

<hr>
<p><small>Email automático de MesaViva</small></p>
`;
}
