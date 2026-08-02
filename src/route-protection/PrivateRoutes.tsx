import { isEmpty } from "lodash";
import { useAppSelector } from "../store/hooks";
import { Navigate, Outlet } from "react-router-dom";



export const PrivateRoutes = () => {

    const user = useAppSelector((state) => state.user);

    if (!isEmpty(user.email) && !isEmpty(user.token) && !isEmpty(user.name)) {
        // Poner peticion a back para validar que token (health token check)
        return <Outlet />
    } else {
        return <Navigate to="/login" replace />
    }

}