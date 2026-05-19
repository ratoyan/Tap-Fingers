import {useNoticeStore, NoticeOptions} from '../store/noticeStore.ts';

type ShortArgs = [title: string, message?: string, confirmLabel?: string];

function makeOpts(type: NoticeOptions['type'], args: ShortArgs, autoHideMs?: number): NoticeOptions {
    const [title, message, confirmLabel] = args;
    return {type, title, message, confirmLabel, autoHideMs};
}

export const notice = {
    success: (...args: ShortArgs) =>
        useNoticeStore.getState().show(makeOpts('success', args, 2200)),

    error: (...args: ShortArgs) =>
        useNoticeStore.getState().show(makeOpts('error', args)),

    info: (...args: ShortArgs) =>
        useNoticeStore.getState().show(makeOpts('info', args)),

    show: (opts: NoticeOptions) => useNoticeStore.getState().show(opts),
    hide: () => useNoticeStore.getState().hide(),
};
