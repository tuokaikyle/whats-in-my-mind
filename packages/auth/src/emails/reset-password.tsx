/** @jsxImportSource react */

import { Button, Container, Heading, Hr, Link, Text } from '@react-email/components';
import { render } from '@react-email/render';

export function ResetPassword({ url }: { url: string }) {
  return (
    <Container style={{ maxWidth: '480px', margin: '0 auto', padding: '24px' }}>
      <Heading style={{ marginBottom: '24px' }}>Reset your password</Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px' }}>
        We received a request to reset the password for your What's in My Mind account.
      </Text>
      <Button
        href={url}
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#000',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '6px',
        }}
      >
        Reset password
      </Button>
      <Hr style={{ margin: '24px 0', borderColor: '#eee' }} />
      <Text style={{ fontSize: '12px', color: '#666' }}>
        If the button above doesn't work, paste this link into your browser:{' '}
        <Link href={url} style={{ color: '#666' }}>
          {url}
        </Link>
      </Text>
      <Text style={{ fontSize: '12px', color: '#666' }}>
        This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
      </Text>
    </Container>
  );
}

export async function renderResetPassword(url: string): Promise<string> {
  return render(<ResetPassword url={url} />);
}
