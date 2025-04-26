import { motion } from "framer-motion";

const StatCard = ({ name, icon: Icon, value, color }) => {
	return (
		<motion.div
			className='bg-white-800 bg-opacity-50  overflow-hidden shadow-lg rounded-xl border border-gray-700'
			whileHover={{ y: -2, boxShadow: "0 25px 25px -12px rgba(0, 0, 0, 0.1)" }}
		>
			<div className='px-4 py-5 sm:p-6'>
				<span className='flex items-center text-sm font-medium text-gray-400'>
					<Icon size={20} className='mr-2' style={{ color }} />
					{name}
				</span>
				<p className='mt-1 text-3xl font-semibold text-black-100'>{value}</p>
			</div>
		</motion.div>
	);
};
export default StatCard;