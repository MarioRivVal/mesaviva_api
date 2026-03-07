import { ReservationPendingParams } from '@modules/notifications/domain/ports/email.service.port';

type ReservationPendingTemplateParams = ReservationPendingParams & {
  cancellationUrl: string;
};

export function getReservationPendingTemplate(
  params: ReservationPendingTemplateParams,
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
<h3>¿Necesitas cancelar?</h3>
<p>Si ya no necesitas la reserva, puedes cancelar tu solicitud haciendo clic en el siguiente enlace:</p>
<p><a href="${params.cancellationUrl}">Cancelar mi solicitud</a></p>
<p><small>O copia este enlace en tu navegador: ${params.cancellationUrl}</small></p>

<hr>
<p><small>Email automático de MesaViva</small></p>
`;
}
