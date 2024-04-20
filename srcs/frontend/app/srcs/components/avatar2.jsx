import ftReact from "../ft_react";

const Avatar = (props) => (
    <img
        src={props.img.replace("data", "data:").replace("base64", ";base64,")}
        style={{objectFit: 'cover', borderRadius: '100%', aspectRatio: '1 / 1'}}					
        alt="profile"
        width={props.size || "90%"}
    ></img>
)

export default Avatar;