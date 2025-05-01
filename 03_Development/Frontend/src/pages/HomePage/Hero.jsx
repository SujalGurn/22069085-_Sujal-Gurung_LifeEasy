// Hero.tsx - Hero section with main heading and CTA buttons
import React from 'react';
import Button from '../../components/ui/button.jsx'; // Assuming you have a Button component
const Hero = () => {
    return (
      <section className="py-24 bg-gradient-to-b from-[#fdfbf7] to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-8 leading-tight text-gray-800 animate-fade-in">
              Our bodies are our gardens<br />
              – our wills are our<br />
              <span className="text-blue-600">gardeners.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-12">
              Your health journey begins with us. Experience personalized care that puts you first.
            </p>
            <div className="flex justify-center gap-4 mb-16">
              <Button className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
                Book Appointment
              </Button>
              <Button variant="outline" className="text-lg px-8 py-6">
                Learn More
              </Button>
            </div>
            <div className="relative">
              <img 
                src="/lovable-uploads/3b42b96e-7652-4b8e-ae3a-b51ffdb9d942.png" 
                alt="Healthcare illustrations" 
                className="w-full rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>
    );
  };

  export default Hero;
  