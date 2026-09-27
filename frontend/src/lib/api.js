// API client for connecting the React/Vite frontend
// to the Spring Boot backend running on port 8080.

export const API_ROOT =
    (import.meta.env && import.meta.env.VITE_API_ROOT) || '/api';

let actorHeader = null;

// Set the currently logged-in user
export const setActor = (username) => {
    actorHeader = username;
};

// Common request function
async function request(path, opts = {}) {

    const headers = {
        'Content-Type': 'application/json',

        ...(actorHeader
            ? { 'X-Actor': actorHeader }
            : {}),

        ...(opts.headers || {}),
    };

    let response;

    try {
        response = await fetch(
            `${API_ROOT}${path}`,
            {
                ...opts,
                headers,
            }
        );
    } catch (networkError) {

        const error = new Error(
            `Unable to reach backend at ${API_ROOT}. ` +
            `Is the Spring Boot server running on port 8080?`
        );

        error.network = true;
        error.cause = networkError;

        throw error;
    }

    // Handle HTTP errors
    if (!response.ok) {

        let body = {
            error: `Request failed (${response.status})`
        };

        try {
            body = {
                ...body,
                ...(await response.json())
            };
        } catch (_) {
            // Response was not JSON
        }

        const error = new Error(
            body.error ||
            body.message ||
            `Request failed (${response.status})`
        );

        error.status = response.status;
        error.payload = body;

        throw error;
    }

    // No content response
    if (response.status === 204) {
        return null;
    }

    const text = await response.text();

    return text ? JSON.parse(text) : null;
}


// ======================================================
// API
// ======================================================

export const api = {

    // ==================================================
    // AUTHENTICATION
    // ==================================================

    login: (username, password) => {

        return request(
            '/auth/login',
            {
                method: 'POST',

                body: JSON.stringify({
                    username,
                    password
                })
            }
        );
    },

    register: (payload) => {

        return request(
            '/auth/register',
            {
                method: 'POST',

                body: JSON.stringify(payload)
            }
        );
    },


    // ==================================================
    // STUDENTS
    // ==================================================

    list: ({
        q = '',
        status = '',
        sortBy = 'id',
        order = 'asc'
    } = {}) => {

        const params = new URLSearchParams({
            q,
            status,
            sortBy,
            order
        });

        return request(
            `/students?${params.toString()}`
        );
    },


    get: (id) => {

        return request(
            `/students/${id}`
        );
    },


    create: (payload) => {

        return request(
            '/students',
            {
                method: 'POST',
                body: JSON.stringify(payload)
            }
        );
    },


    update: (id, payload) => {

        return request(
            `/students/${id}`,
            {
                method: 'PUT',
                body: JSON.stringify(payload)
            }
        );
    },


    remove: (id) => {

        return request(
            `/students/${id}`,
            {
                method: 'DELETE'
            }
        );
    },


    bulkDelete: (ids) => {

        return request(
            '/students/bulk-delete',
            {
                method: 'POST',

                body: JSON.stringify({
                    ids
                })
            }
        );
    },


    attendance: (id, attendance) => {

        return request(
            `/students/${id}/attendance`,
            {
                method: 'PATCH',

                body: JSON.stringify({
                    attendance
                })
            }
        );
    },


    grade: (id, semester, gpa) => {

        return request(
            `/students/${id}/grade`,
            {
                method: 'PATCH',

                body: JSON.stringify({
                    semester,
                    gpa
                })
            }
        );
    },


    analytics: () => {

        return request(
            '/students/analytics'
        );
    },


    top: (limit = 10) => {

        return request(
            `/students/top?limit=${limit}`
        );
    },


    importData: () => {

        return request(
            '/students/import-department-data',
            {
                method: 'POST'
            }
        );
    },


    profile: (id, payload) => {

        return request(
            `/students/profile/${id}`,
            {
                method: 'PUT',

                body: JSON.stringify(
                    payload
                )
            }
        );
    },


    activity: (limit = 25) => {

        return request(
            `/students/activity?limit=${limit}`
        );
    },


    notifications: (user = '*') => {

        return request(
            `/students/notifications?user=${encodeURIComponent(user)}`
        );
    },


    notifRead: (id) => {

        return request(
            `/students/notifications/${id}/read`,
            {
                method: 'POST'
            }
        );
    },


    notifReadAll: (user = '*') => {

        return request(
            `/students/notifications/read-all?user=${encodeURIComponent(user)}`,
            {
                method: 'POST'
            }
        );
    },


    // ==================================================
    // ANNOUNCEMENTS
    // ==================================================

    announcements: () => {

        return request(
            '/students/announcements'
        );
    },


    postAnnouncement: (payload) => {

        return request(
            '/students/announcements',
            {
                method: 'POST',

                body: JSON.stringify(
                    payload
                )
            }
        );
    },


    deleteAnnouncement: (id) => {

        return request(
            `/students/announcements/${id}`,
            {
                method: 'DELETE'
            }
        );
    },


    pinAnnouncement: (id, pinned) => {

        return request(
            `/students/announcements/${id}/pin`,
            {
                method: 'POST',

                body: JSON.stringify({
                    pinned
                })
            }
        );
    },


    // ==================================================
    // PREDICTOR
    // ==================================================

    predict: (payload) => {

        return request(
            '/students/predict',
            {
                method: 'POST',

                body: JSON.stringify(
                    payload
                )
            }
        );
    },


    // ==================================================
    // ACHIEVEMENTS
    // ==================================================

    achievements: (id) => {

        return request(
            `/students/${id}/achievements`
        );
    },


    // ==================================================
    // COMPARE STUDENTS
    // ==================================================

    compare: (ids) => {

        return request(
            '/students/compare',
            {
                method: 'POST',

                body: JSON.stringify({
                    ids
                })
            }
        );
    },


    // ==================================================
    // BACKEND HEALTH
    // ==================================================

    health: () => {

        return request(
            '/students/health'
        );
    }
};


// ======================================================
// BACKEND CONNECTION TEST
// ======================================================

export async function probeBackend() {

    try {

        const controller =
            new AbortController();

        const timeout =
            setTimeout(
                () => controller.abort(),
                2500
            );

        const response =
            await fetch(
                `${API_ROOT}/students/health`,
                {
                    signal:
                        controller.signal
                }
            );

        clearTimeout(timeout);

        return response.ok;

    } catch (_) {

        return false;
    }
}


// ======================================================
// SERVER-SENT EVENTS
// ======================================================

export function subscribeStream({
    onEvent,
    onError
} = {}) {

    let eventSource;

    try {

        eventSource =
            new EventSource(
                `${API_ROOT}/students/stream`
            );

    } catch (error) {

        if (onError) {
            onError(error);
        }

        return () => {};
    }


    const events = [
        'hello',
        'ping',
        'activity',
        'notification',
        'students-changed'
    ];


    events.forEach((eventName) => {

        eventSource.addEventListener(
            eventName,
            (event) => {

                let data = event.data;

                try {
                    data = JSON.parse(
                        event.data
                    );
                } catch (_) {
                    // Keep original string
                }

                if (onEvent) {

                    onEvent(
                        eventName,
                        data
                    );
                }
            }
        );
    });


    eventSource.onerror = (error) => {

        if (onError) {
            onError(error);
        }
    };


    // Function to close connection
    return () => {

        eventSource.close();
    };
}