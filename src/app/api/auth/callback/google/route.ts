
import { NextApiRequest, NextApiResponse } from 'next';
import nextAuth from 'next-auth';
import { authOptions } from '../../../../../features/authOptions';

export default async function googleCallback(req: NextApiRequest, res: NextApiResponse) {
  return await nextAuth(req, res, authOptions);
}