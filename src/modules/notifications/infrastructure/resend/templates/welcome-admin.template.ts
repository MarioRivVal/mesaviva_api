import { WelcomeAdminParams } from '../../../application/ports/email.service.port';

export function getWelcomeAdminTemplate(params: WelcomeAdminParams): string {
  return `
    <h1>🎉 ¡Bienvenido a MesaViva!</h1>
    
    <p>Hola ${params.firstName} ${params.lastName},</p>
    
    <p>Se ha creado tu cuenta de administrador para <strong>${params.restaurantName}</strong>.</p>
    
    <h2>Tus Credenciales de Acceso:</h2>
    <ul>
    <li><strong>Email:</strong> ${params.to}</li>
    <li><strong>Contraseña Temporal:</strong> <code>${params.tempPassword}</code></li>
    </ul>
    
    <p>⚠️ <strong>IMPORTANTE:</strong> Debes cambiar tu contraseña al iniciar sesión por primera vez.</p>
    
    <h2>Datos de tu Restaurante:</h2>
    <ul>
    <li><strong>Nombre:</strong> ${params.restaurantName}</li>
    <li><strong>Categoría:</strong> ${params.restaurantCategory}</li>
    <li><strong>Dirección:</strong> ${params.restaurantAddress}</li>
    <li><strong>Teléfono:</strong> ${params.restaurantPhone}</li>
    <li><strong>Email:</strong> ${params.restaurantEmail}</li>
    </ul>
    
    <h2>Próximos Pasos:</h2>
    <ol>
    <li>Accede al panel de administración</li>
    <li>Cambia tu contraseña temporal</li>
    <li>Configura los horarios de tu restaurante</li>
    <li>¡Empieza a recibir reservas!</li>
    </ol>
    
    <hr>
    <p><small>Email automático de MesaViva</small></p>
`;
}
