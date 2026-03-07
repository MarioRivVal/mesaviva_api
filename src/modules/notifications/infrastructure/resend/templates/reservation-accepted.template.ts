import { ReservationAcceptedParams } from '@modules/notifications/domain/ports/email.service.port';

type ReservationAcceptedTemplateParams = ReservationAcceptedParams & {
  cancellationUrl: string;
};

export function getReservationAcceptedTemplate(
  params: ReservationAcceptedTemplateParams,
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
<h3>¿Necesitas cancelar?</h3>
<p>Si no puedes asistir, puedes cancelar tu reserva haciendo clic en el siguiente enlace:</p>
<p><a href="${params.cancellationUrl}">Cancelar mi reserva</a></p>
<p><small>O copia este enlace en tu navegador: ${params.cancellationUrl}</small></p>

<hr>
<p><small>Email automático de MesaViva</small></p>
`;
}
