export function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function formatFirebaseError(code: string): string {
    switch (code) {
        case 'auth/email-already-in-use':
            return 'Este e-mail já está cadastrado.';
        case 'auth/invalid-email':
            return 'Formato de e-mail inválido.';
        case 'auth/weak-password':
            return 'A senha deve ter pelo menos 6 caracteres.';
        case 'auth/user-not-found':
            return 'Usuário não encontrado.';
        case 'auth/wrong-password':
            return 'Senha incorreta.';
        case 'auth/network-request-failed':
            return 'Falha na conexão. Verifique sua internet.';
        default:
            return 'Erro ao processar a requisição. Tente novamente.';
    }
}
