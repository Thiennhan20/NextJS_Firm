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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero Section */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black" />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-center"
          >
            About Movie3D
          </motion.h1>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            At Movie3D, we&apos;re revolutionizing the way people discover and experience movies. 
            By combining cutting-edge 3D technology with a passion for cinema, we create an 
            immersive platform that brings movies to life in ways never seen before.
          </p>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">What We Offer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
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
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
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
          animate={{ opacity: 1, y: 0 }}
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