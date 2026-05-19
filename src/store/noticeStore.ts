import {create} from 'zustand';

export type NoticeType = 'success' | 'error' | 'info';

export interface NoticeOptions {
    type: NoticeType;
    title?: string;
    message?: string;
    confirmLabel?: string;
    autoHideMs?: number;
}

interface NoticeState {
    visible: boolean;
    type: NoticeType;
    title: string;
    message: string;
    confirmLabel: string;
    autoHideMs: number | null;
    show: (opts: NoticeOptions) => void;
    hide: () => void;
}

export const useNoticeStore = create<NoticeState>((set) => ({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    confirmLabel: 'OK',
    autoHideMs: null,

    show: (opts) =>
        set({
            visible: true,
            type: opts.type,
            title: opts.title ?? '',
            message: opts.message ?? '',
            confirmLabel: opts.confirmLabel ?? 'OK',
            autoHideMs: opts.autoHideMs ?? null,
        }),

    hide: () => set({visible: false}),
}));
