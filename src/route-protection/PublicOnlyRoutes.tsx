import { isEmpty } from "lodash";
import { useAppSelector } from "../store/hooks";
import { Navigate, Outlet } from "react-router-dom";



export const PublicOnlyRoutes = () => {

    const user = useAppSelector((state) => state.user);

    if (!isEmpty(user.email) && !isEmpty(user.token) && !isEmpty(user.name)) {
        return <Navigate to="/" replace />
    } else {
        return <Outlet />
    }

}
