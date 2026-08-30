const API_URL = '/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('caffisense_token');
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};

export const registerApi = async (data: { name: string; email: string; password: string; password_confirmation: string }) => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || (result.errors ? Object.values(result.errors).flat().join(', ') : 'Registrasi gagal.'));
    }
    return result;
};

export const loginApi = async (data: { email: string; password: string }) => {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || (result.errors ? Object.values(result.errors).flat().join(', ') : 'Login gagal. Periksa kembali email dan password.'));
    }
    return result;
};

export const logoutApi = async () => {
    const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    return response.json();
};

export const getMeApi = async () => {
    const response = await fetch(`${API_URL}/me`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Gagal mengambil sesi pengguna.');
    }
    return response.json();
};

export const updateProfileApi = async (data: any) => {
    const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.message || 'Gagal memperbarui profil.');
    }
    return result;
};

export const uploadAvatarApi = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('caffisense_token');
    
    const response = await fetch(`${API_URL}/profile/avatar`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData, // FormData automatically sets the correct Content-Type with boundary
    });

    if (response.status === 413) {
        throw new Error('Ukuran foto terlalu besar. Maksimal ukuran file foto adalah 10MB.');
    }

    let result;
    try {
        result = await response.json();
    } catch {
        throw new Error(`Server mengembalikan respon ${response.status}. Gagal memproses gambar.`);
    }

    if (!response.ok) {
        throw new Error(result.message || (result.errors?.avatar ? result.errors.avatar.join(', ') : 'Gagal mengunggah foto profil.'));
    }
    return result;
};

export const submitAssessment = async (data: any) => {
    const response = await fetch(`${API_URL}/assessment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    
    if (!response.ok) {
        throw new Error('Failed to submit assessment');
    }
    return response.json();
};

export const getLatestAssessmentApi = async () => {
    const response = await fetch(`${API_URL}/assessments/latest`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    return response.json();
};

export const getAllAssessmentsApi = async () => {
    const response = await fetch(`${API_URL}/assessments`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) return { assessments: [] };
    return response.json();
};

export const getAssessment = async (id: number) => {
    const response = await fetch(`${API_URL}/assessment/${id}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to get assessment');
    }
    return response.json();
};

export const logChallenge = async (data: any) => {
    const response = await fetch(`${API_URL}/challenge/log`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to log challenge');
    }
    return response.json();
};

export const getChallengeProgress = async (userId: number) => {
    const response = await fetch(`${API_URL}/challenge/progress/${userId}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to get challenge progress');
    }
    return response.json();
};
