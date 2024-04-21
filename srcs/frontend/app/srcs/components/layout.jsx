import ftReact from "../ft_react";

const Layout = (props) => (
	<div className="
		container-md
		text-center
		d-flex
		flex-column
		mb-3
		justify-content-center
		align-items-center
		p-1
		h-100
	">
		{props.children}
	</div>
);

export default Layout;