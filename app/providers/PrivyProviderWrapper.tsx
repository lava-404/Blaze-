'use client';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { PrivyProvider } from '@privy-io/react-auth';

export default function PrivyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['email', 'wallet', 'google', 'twitter'],


      }}
    >
      {children}
    </PrivyProvider>
  );
}