import React from 'react'
import {
    FaFacebook,
    FaInstagram,
    FaTwitter,
    FaLinkedin,
} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useState } from 'react';

const Footer = () => {
  return (
    <div className='w-full mt-24 bg-[#53B774] text-black py-y px-2 pt-12'>
        {/* Newsletter Section */}
        <div className='max-w-[1240px] mx-auto py-8 text-center text-white'>
            <h3 className='text-4xl font-bold mb-14'>Discover expert advice and insights for a healthier, happier you.</h3>
            
            <div className='flex flex-col items-center justify-center'>
                <form className='flex flex-col sm:flex-row gap-4 mx-2 mb-4 w-full max-w-md rounded-2xl'>
                    <input 
                        className='w-full p-3 rounded-md font-semibold text-gray-900' 
                        type="email" 
                        placeholder='Email Address'
                    />
                    <button className='p-1 px-3 bg-[#1D2366] rounded-2xl  hover:bg-[#F9CC48] transition-colors'>
                        <h3 className='text-white hover:text-black font-bold px-4 '>Sign me up</h3>
                    </button>
                </form>
                <p className='text-sm text-black'>
                    Free, and no spam ever. Unsubscribe anytime.
                </p>
            </div>
        </div>

        {/* Columns Section */}
        <div className='max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-gray-600 py-8'>
            {/* Thriveworks Column */}
            <div>
                <h6 className='font-bold uppercase pt-2'>Life Easy</h6>
                <ul className='mt-4 space-y-2'>
                    <li className=' cursor-pointer'>About us</li>
                    <li className=' cursor-pointer'>Doctors</li>
                    <li className=' cursor-pointer'>Locations</li>
                    <li className=' cursor-pointer'>FAQ</li>
                    <li className=' cursor-pointer'>Editorial policy</li>
                    
                    <li className=' cursor-pointer'><Link to="/doctorsignup" className="text-black ">Register As Doctor</Link></li>
                </ul>
            </div>

            {/* Resources Column */}
            <div>
                <h6 className='font-bold uppercase pt-2'>Resources</h6>
                <ul className='mt-4 space-y-2'>
                    <li className=' cursor-pointer'>Nutrition Tips</li>
                    <li className=' cursor-pointer'>Mental Wellness</li>
                    <li className=' cursor-pointer'>Fitness Routines</li>
                    <li className=' cursor-pointer'>Disease Prevention</li>
                    <li className=' cursor-pointer'>Self-care</li>
                    <li className=' cursor-pointer'>Sleep Improvement</li>
                </ul>
            </div>

            {/* Services Column */}
            <div>
                <h6 className='font-bold uppercase pt-2'>Services</h6>
                <ul className='mt-4 space-y-2'>
                    <li className=' cursor-pointer'>Emergency Care</li>
                    <li className=' cursor-pointer'>Surgery Services</li>
                    <li className=' cursor-pointer'>Maternity Care</li>
                    <li className=' cursor-pointer'>Diagnostic Imaging</li>
                    <li className=' cursor-pointer'>Outpatient Services</li>
                </ul>
            </div>

            {/* Insurance Column */}
            <div>
                <h6 className='font-bold uppercase pt-2'>Insurance</h6>
                <ul className='mt-4 space-y-2'>
                    <li className=' cursor-pointer'>Aetna</li>
                    <li className=' cursor-pointer'>Optum / UnitedHealthcare</li>
                    <li className=' cursor-pointer'>BCBS Plans</li>
                </ul>
            </div>
        </div>

        {/* Bottom Section */}
        <div className='flex flex-col max-w-[1240px] px-2 py-4 mx-auto justify-between sm:flex-row text-center text-black-500'>
            <p className='py-4'>2024 LifeEasy, Inc. All rights reserved</p>
            <div className='flex justify-between sm:w-[300px] pt-4 text-2xl'>
                <FaFacebook className='hover:text-blue-600 cursor-pointer' />
                <FaInstagram className='hover:text-pink-600 cursor-pointer' />
                <FaTwitter className='hover:text-blue-400 cursor-pointer' />
                <FaLinkedin className='hover:text-blue-700 cursor-pointer' />
            </div>
        </div>
    </div>
  )
}

export default Footer