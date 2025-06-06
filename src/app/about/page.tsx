'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { StarIcon, FilmIcon, UserGroupIcon, SparklesIcon } from '@heroicons/react/24/solid'

const team = [
  {
    name: 'John Doe',
    role: 'Founder & CEO',
    image: `https://picsum.photos/400/400?random=${Math.random()}`,
    bio: 'Passionate about movies and technology, bringing the best of both worlds together.'
  },
  {
    name: 'Jane Smith',
    role: 'Lead Developer',
    image: `https://picsum.photos/400/400?random=${Math.random()}`,
    bio: 'Full-stack developer with a love for creating immersive web experiences.'
  },
  {
    name: 'Mike Johnson',
    role: 'UI/UX Designer',
    image: `https://picsum.photos/400/400?random=${Math.random()}`,
    bio: 'Creating beautiful and intuitive interfaces that users love.'
  }
]

const features = [
  {
    icon: <StarIcon className="h-8 w-8 text-yellow-500" />,
    title: 'Curated Content',
    description: 'Carefully selected movies and reviews from trusted sources.'
  },
  {
    icon: <FilmIcon className="h-8 w-8 text-red-500" />,
    title: '3D Experience',
    description: 'Immersive 3D visualizations of movie posters and scenes.'
  },
  {
    icon: <UserGroupIcon className="h-8 w-8 text-blue-500" />,
    title: 'Community',
    description: 'Join our growing community of movie enthusiasts.'
  },
  {
    icon: <SparklesIcon className="h-8 w-8 text-purple-500" />,
    title: 'Modern Design',
    description: 'Beautiful and responsive design that works on all devices.'
  }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white pt-20">
      {/* Hero Section */}
      <div className="relative h-[40vh] w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black z-10" />
        <div className="absolute inset-0">
             <Image
                src={`https://picsum.photos/1920/1080?random=${Math.random()}`}
                alt="About Us Background"
                fill
                className="object-cover"
                priority
              />
        </div>
        <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold text-center relative z-20"
          >
            About MovieWorld
          </motion.h1>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-6"
        >
          <h2 className="text-3xl font-bold">Our Mission</h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            At MovieWorld, we&apos;re dedicated to transforming the way you experience cinema. 
            Our mission is to create an innovative and immersive platform that connects movie 
            enthusiasts with the films they love, offering unique features and a vibrant community.
          </p>
           <p className="text-gray-400 leading-relaxed">
            We strive to be the leading destination for discovering new movies, revisiting classics, 
            and engaging with a community that shares your passion. Our focus is on providing 
            high-quality content, cutting-edge technology, and a user-friendly experience on all devices.
          </p>
        </motion.div>
      </div>

      {/* Our Story Section */}
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
             initial={{ opacity: 0, x: -50 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5 }}
             className="relative h-64 md:h-96 rounded-xl overflow-hidden shadow-lg"
          >
             <Image
                src={`https://picsum.photos/800/600?random=${Math.random()}`}
                alt="Our Story"
                fill
                className="object-cover"
             />
          </motion.div>
          <motion.div
             initial={{ opacity: 0, x: 50 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5 }}
             className="space-y-6"
          >
             <h2 className="text-3xl font-bold">Our Story</h2>
             <p className="text-gray-300 leading-relaxed">
                Founded in [Year], MovieWorld started with a simple idea: to make discovering and 
                enjoying movies a more interactive and engaging experience. What began as a small 
                project has grown into a platform loved by moviegoers worldwide.
             </p>
             <p className="text-gray-400 leading-relaxed">
                From the early days of brainstorming unique features like our 3D poster viewer to 
                building a robust platform that scales, our journey has been fueled by a deep 
                appreciation for film and a desire to innovate. We&apos;re constantly working to bring 
                new features and content to our users.
             </p>
          </motion.div>
       </div>

       {/* Our Values Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5, delay: 0.1 }}
             className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 space-y-4"
          >
             <h3 className="text-xl font-semibold">Innovation</h3>
             <p className="text-gray-300">Constantly exploring new technologies to enhance the movie experience.</p>
          </motion.div>
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5, delay: 0.2 }}
             className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 space-y-4"
          >
             <h3 className="text-xl font-semibold">Community</h3>
             <p className="text-gray-300">Building a welcoming space for movie lovers to connect and share.</p>
          </motion.div>
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5, delay: 0.3 }}
             className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 space-y-4"
          >
             <h3 className="text-xl font-semibold">Quality</h3>
             <p className="text-gray-300">Providing high-quality content and a seamless user experience.</p>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">What We Offer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 text-center"
            >
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden"
            >
              <div className="relative h-64">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-red-500 mb-3">{member.role}</p>
                <p className="text-gray-300">{member.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
          <p className="text-gray-300 mb-8">
            Have questions or suggestions? We&apos;d love to hear from you!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Contact Us
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
} 