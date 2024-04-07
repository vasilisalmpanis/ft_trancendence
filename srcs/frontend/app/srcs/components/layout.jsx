import ftReact from "../ft_react";

const Layout = (props) => {
	const children = props.children;
	props.children = [];
	return (
		<div className="
			container-md
			text-center
			d-flex
			flex-column
			mb-3
			justify-content-center
			align-items-center
			h-100
		">
			{children}
		</div>
	);
};

export default Layout;