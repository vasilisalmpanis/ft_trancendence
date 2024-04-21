import ftReact from "../ft_react";
import BarLayout from "../components/barlayout.jsx";
import { apiClient } from "../api/api_client.js";

const ReRoutePage = (props) => {
    const [uselessState, setUselessState] = ftReact.useState(null);
    const query = window.location.search;
    const params = new URLSearchParams(query);
    const path = "/" + params.get('path') + "/" + params.get('id');
    const getState = async () => {
        const data = await apiClient.get("/healthcheck");
        if (data.error) {
            return;
        }
        setUselessState(data);
    };
    if (!uselessState)
        getState();
    
    return (
        <BarLayout route={props.route}>
            {
                uselessState ? props.route(path) : <div>Loading...</div>
            }
        </BarLayout>
    );
}


export default ReRoutePage;