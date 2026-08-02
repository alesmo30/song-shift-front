import { isString } from "lodash"
import type { ReactNode } from "react"

export const ErrorSpan = ({ children }: { children?: ReactNode }) => {
    return (
        isString(children) ?
            <span style={{ color: 'red' }}>{children}</span>
            :
            children
    );
};