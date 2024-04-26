import ftReact		from "../ft_react";

const b64toBlob = (base64) => 
  fetch(base64).then(res => res.blob())

const Avatar = (props) => {
	const [blob, setBlob] = ftReact.useState(null);
	ftReact.useEffect(async ()=>{
		const fetchBlob = async (image) => {
			let img = image.startsWith("data:")
				? image
				: image.replace("data", "data:").replace("base64", ";base64,");
			setBlob(await b64toBlob(img));
		};
		if (props.img && typeof(props.img) === 'string' && !blob)
		{
			if (props.img.startsWith("data"))
				await fetchBlob(props.img);
			//else if (props.img.startsWith("http"))
			//	setBlob(props.img)
		}
		else if (props.img && props.img instanceof Blob && (blob !== props.img))
			setBlob(props.img);
	},[props.img]);
	return (
		<img
			loading="lazy"
			width={props.size || "90%"}
			style={{objectFit: 'cover', borderRadius: '100%', aspectRatio: '1 / 1'}}
			src={blob && URL.createObjectURL(blob)}
			className="img-thumbnail"
		/>
	)
}

export default Avatar;