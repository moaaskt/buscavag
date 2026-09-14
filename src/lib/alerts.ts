import Swal from 'sweetalert2';

/**
 * Confirm de exclusão com tema Buscavag (zinc dark + emerald/rose accents).
 * Retorna `true` se o usuário confirmou.
 */
export async function confirmDelete(options: {
  title?: string;
  text?: string;
  confirmText?: string;
}): Promise<boolean> {
  const result = await Swal.fire({
    title: options.title ?? 'Excluir vaga?',
    text: options.text ?? 'Esta ação não pode ser desfeita.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? 'Sim, excluir',
    cancelButtonText: 'Cancelar',

    // ── Theming ──────────────────────────────────────────────────────────────
    background: '#18181b',          // zinc-900
    color: '#f4f4f5',               // zinc-100
    iconColor: '#f43f5e',           // rose-500

    customClass: {
      popup:         'swal-buscavag-popup',
      title:         'swal-buscavag-title',
      htmlContainer: 'swal-buscavag-text',
      confirmButton: 'swal-buscavag-confirm',
      cancelButton:  'swal-buscavag-cancel',
      actions:       'swal-buscavag-actions',
    },

    buttonsStyling: false,          // usa nossas classes custom
    reverseButtons: true,           // Cancelar à esquerda, Confirmar à direita
    focusCancel: true,              // foca no Cancelar por segurança
  });

  return result.isConfirmed;
}

/**
 * Confirm de purga de vagas não-tech com tema Buscavag (zinc dark + rose/amber accents).
 * Retorna `true` se o usuário confirmou.
 */
export async function confirmPurge(): Promise<boolean> {
  const result = await Swal.fire({
    title: 'Purgar vagas não-tech?',
    text: 'Esta ação irá remover permanentemente do banco todas as vagas com cargos operacionais (pedreiro, motorista, etc.).',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, purgar banco',
    cancelButtonText: 'Cancelar',

    // ── Theming ──────────────────────────────────────────────────────────────
    background: '#18181b',          // zinc-900
    color: '#f4f4f5',               // zinc-100
    iconColor: '#f59e0b',           // amber-500

    customClass: {
      popup:         'swal-buscavag-popup',
      title:         'swal-buscavag-title',
      htmlContainer: 'swal-buscavag-text',
      confirmButton: 'swal-buscavag-confirm bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm shadow-sm',
      cancelButton:  'swal-buscavag-cancel',
      actions:       'swal-buscavag-actions',
    },

    buttonsStyling: false,
    reverseButtons: true,
    focusCancel: true,
  });

  return result.isConfirmed;
}

/**
 * Notificação informativa / alerta com tema Buscavag.
 */
export async function showNotice(
  title: string,
  text: string,
  icon: 'info' | 'warning' | 'error' | 'success' = 'info'
): Promise<void> {
  await Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: 'Entendido',
    background: '#18181b',
    color: '#f4f4f5',
    iconColor: icon === 'warning' ? '#f59e0b' : icon === 'error' ? '#f43f5e' : '#10b981',
    customClass: {
      popup:         'swal-buscavag-popup',
      title:         'swal-buscavag-title',
      htmlContainer: 'swal-buscavag-text',
      confirmButton: 'swal-buscavag-confirm',
    },
    buttonsStyling: false,
  });
}

