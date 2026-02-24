import { ReservationRejectedParams } from '../../../application/ports/email.service.port';

export function getReservationRejectedTemplate(
  params: ReservationRejectedParams,
): string {
  return `
<h1>Reserva No Confirmada ❌</h1>

<p>Hola ${params.customerName} ${params.customerLastName},</p>

<p>Lamentamos informarte que tu reserva <strong>no ha podido ser confirmada</strong>.</p>

<h2>Detalles de la Solicitud:</h2>
<ul>
<li><strong>Fecha:</strong> ${params.date}</li>
<li><strong>Hora:</strong> ${params.time}</li>
<li><strong>Personas:</strong> ${params.numberOfPeople}</li>
</ul>

${
  params.rejectionReason
    ? `
<h3>Motivo:</h3>
<p><em>${params.rejectionReason}</em></p>
`
    : ''
}

<p>Te invitamos a intentar con otra fecha u horario.</p>

<hr>
<p><small>Email automático de MesaViva</small></p>
`;
}
