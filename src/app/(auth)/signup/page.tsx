
import { RegisterForm } from '@/app/features/auth/components/register-from'
import { requireUnauth } from '@/lib/auth-utils';
import React from 'react'

const  page = async() =>{
  await requireUnauth();
  return (
    <div><RegisterForm/></div>
  )
}

export default page